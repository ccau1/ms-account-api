import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthModel } from './interfaces/auth';
import { UserService } from '../User/user.service';
import { compare, hash, genSalt } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthUserTokenModel } from './models/auth.userToken.model';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('Auths') private readonly authRepository: AuthModel,
    private readonly userService: UserService,
  ) {}

  protected async _jwtSign(
    payload: string | object | Buffer,
    secretOrPrivateKey: jwt.Secret,
    options?: jwt.SignOptions,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(payload, secretOrPrivateKey, options, (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      });
    });
  }

  protected async _createUserToken(
    userId: string,
    options?: { accessTokenExpiresIn?: number; refreshTokenExpiresIn?: number },
  ): Promise<AuthUserTokenModel> {
    const opts = {
      // default access to 1 day (seconds)
      accessTokenExpiresIn: 86400,
      // default refresh to 30 days (seconds)
      refreshTokenExpiresIn: 2592000,
      ...options,
    };

    // get current time to handle expires
    const currentTime = Math.floor(new Date().valueOf() / 1000);

    // create access token
    const accessToken = await this._jwtSign(
      {
        sub: userId,
        iat: currentTime,
        exp: currentTime + opts.accessTokenExpiresIn,
        type: null,
      },
      process.env.JWT_SECRET,
    );

    // create refresh token
    const refreshToken = await this._jwtSign(
      {
        sub: userId,
        iat: currentTime,
        exp: currentTime + opts.refreshTokenExpiresIn,
        type: 'refresh',
      },
      process.env.JWT_SECRET,
    );

    // return user token obj
    return {
      accessToken,
      refreshToken,
      expiresIn: opts.accessTokenExpiresIn,
      expiresOn: currentTime + opts.accessTokenExpiresIn,
    };
  }

  public async getUserToken(
    input: string,
    password: string,
  ): Promise<AuthUserTokenModel> {
    const user = await this.userService.findOne({ verifyField: input });

    if (!user) {
      throw new Error('user not found');
    }
    const auth = await this.authRepository.findOne({
      user: user._id.toHexString(),
    });

    if (!auth) {
      throw new Error('auth not found');
    }

    if (!(await compare(password, auth.password))) {
      throw new Error('incorrect password');
    }

    // all passed, return user token
    return this._createUserToken(user._id.toHexString());
  }

  public async refreshUserToken(accessToken: string, refreshToken: string) {
    const decoded = jwt.decode(accessToken);

    const user = await this.userService.findOne({ _ids: [decoded.sub] });

    const auth = await this.authRepository.findOne({
      user: user._id.toHexString(),
      refreshTokens: {
        $elemMatch: {
          code: refreshToken,
          expireAt: { $gt: new Date() },
        },
      },
    });

    return this._createUserToken(user._id.toHexString());
  }
}
