import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

// Interfaces & Services
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { InjectModel } from '@nestjs/mongoose';
import { UserModel } from '../../../User/interfaces/user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel('Users') private readonly userRepository: UserModel,
  ) {
    // FIXME: can't inject user repository?
    // constructor(@InjectModel('Users') private readonly userRepository: User) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: any, jwtpayload: JwtPayload, done: any): Promise<any> {
    try {
      const user = await this.userRepository.findById(jwtpayload.sub);
      if (!user) {
        throw new NotFoundException({
          code: 'data__not_exists',
          payload: {
            key: 'key_user',
          },
        });
      }
      return done(null, { ...user.toJSON() });
    } catch (error) {
      return done(
        new UnauthorizedException({ code: 'err_unauthorized' }),
        false,
      );
    }
  }
}
