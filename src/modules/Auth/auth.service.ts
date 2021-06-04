import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthModel } from './interfaces/auth';
import { UserService } from '../User/user.service';
import { compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthUserTokenModel } from './models/auth.userToken.model';
import { AuthCreateModel } from './models/auth.create.model';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('Auths') private readonly authRepository: AuthModel,
    @Inject(forwardRef(() => UserService))
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
    options?: {
      accessTokenExpiresIn?: number;
      refreshTokenExpiresIn?: number;
      clearTokens?: string[];
    },
  ): Promise<AuthUserTokenModel> {
    const opts = {
      // default access to 1 day (seconds)
      accessTokenExpiresIn: 86400,
      // default refresh to 30 days (seconds)
      refreshTokenExpiresIn: 2592000,
      clearTokens: [],
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

    // clear original/expired tokens
    this.cleanRefreshTokens(userId, opts.clearTokens);

    // add refresh token to db
    this.addRefreshToken(
      userId,
      refreshToken,
      currentTime * 1000 + opts.refreshTokenExpiresIn * 1000,
    );

    // return user token obj
    return {
      accessToken,
      refreshToken,
      expiresIn: opts.accessTokenExpiresIn,
      expiresOn: currentTime + opts.accessTokenExpiresIn,
    };
  }

  public async addRefreshToken(
    userId: string,
    token: string,
    expiresAt: number | Date,
  ) {
    return this.authRepository.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          refreshTokens: { code: token, expiresAt: new Date(expiresAt) },
        },
      },
      {
        new: true,
        lean: true,
      },
    );
  }

  public async cleanRefreshTokens(
    userId: string,
    specificTokens: string[] = [],
  ) {
    const auth = await this.authRepository.findOne({ user: userId });
    auth.refreshTokens = auth.refreshTokens.filter(
      t =>
        t.expiresAt.valueOf() > new Date().valueOf() &&
        !specificTokens.includes(t.code),
    );

    return auth.save();
  }

  public async getUserToken(
    input: string,
    password: string,
  ): Promise<AuthUserTokenModel> {
    const user = await this.userService.findOne({
      verifyField: input,
    });

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

    if (!user) throw new BadRequestException({ code: 'user_not_found' });

    const auth = await this.authRepository.findOne({
      user: user._id.toHexString(),
      refreshTokens: {
        $elemMatch: {
          code: refreshToken,
        },
      },
    });

    if (!auth) throw new BadRequestException({ code: 'invalid refreshToken' });

    if (
      auth.refreshTokens
        .find(t => t.code === refreshToken)
        .expiresAt.valueOf() < new Date().valueOf()
    )
      throw new BadRequestException({ code: 'refresh_token_expired' });

    return this._createUserToken(user._id.toHexString(), {
      clearTokens: [refreshToken],
    });
  }

  public async setUserLocked(userId: string, isLocked: boolean) {
    return this.authRepository.findOneAndUpdate(
      { user: userId },
      { isLocked },
      { new: true },
    );
  }

  public async setVerified(userId: string, type: string, isVerified = true) {
    return this.authRepository.findOneAndUpdate(
      { user: userId },
      { [`verified.${type}`]: !!isVerified },
      { new: true },
    );
  }

  public async setIsVerified(userId: string, isVerified: boolean) {
    return this.authRepository.findOneAndUpdate(
      { user: userId },
      { isVerified },
      { new: true },
    );
  }

  public async generateToken(userId: string, expiresAt: Date) {
    // create token
    const code = await this._jwtSign(
      `genToken_${userId}_${expiresAt.valueOf()}`,
      process.env.JWT_SECRET,
    );
    // set genToken obj
    const genToken = { code, expiresAt };
    // get auth obj by user id
    const auth = await this.authRepository.findOne({ user: userId });
    // set genTokens array by removing old ones and adding this
    // new one
    auth.genTokens = [
      ...auth.genTokens.filter(g => g.expiresAt > new Date()),
      genToken,
    ];
    // save and return new auth
    return auth.save();
  }

  public async create(auth: AuthCreateModel) {
    const authCreated = await this.authRepository.create(auth);

    return authCreated;
  }
}
