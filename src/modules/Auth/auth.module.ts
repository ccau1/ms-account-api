import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthSchema } from './schemas/auth.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../User/user.module';
import { JwtStrategy } from './Passport/strategies';
import { UserSchema } from '../User/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Auths', schema: AuthSchema }]),
    MongooseModule.forFeature([{ name: 'Users', schema: UserSchema }]),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
