import { Controller, Post, Body, Query, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialModel } from './models/auth.credential.model';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/token')
  public async getUserToken(
    @Body() credentials: AuthCredentialModel,
    @Headers('Authorization') authorization: string,
    @Query('refresh-token') refreshToken?: string,
  ) {
    if (refreshToken) {
      return this.authService.refreshUserToken(
        authorization.replace(/^(B|b)earer /, ''),
        refreshToken,
      );
    }
    return this.authService.getUserToken(
      credentials.input,
      credentials.password,
    );
  }
}
