import { Body, Controller, Delete, Get, HttpException, HttpStatus, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import GoogleTokenDto from './dto/google-token.-dto';
import { LoginDto } from './dto/login.dto';
import RefreshTokenDto from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Req() request,
    @Ip() ip: string,
    @Body() body: LoginDto
  ) {
    return this.authService.login(
      body.email, 
      body.password, 
      {ipAddress: ip, userAgent: request.headers['user-agent']}
    );
  }

  @Post('google')
  async googleLogin(
    @Req() request,
    @Ip() ip: string,
    @Body() body: GoogleTokenDto
  ): Promise<{ accessToken: string, refreshToken: string}>{
    const result = await this.authService.loginGoogleUser(body.token, {
      userAgent: request.headers['user-agent'],
      ipAddress: ip
    });

    if (result) {
      return result;
    } else {
      throw new HttpException({
        status: HttpStatus.UNAUTHORIZED,
        error: 'Error while login with Google',
      }, HttpStatus.UNAUTHORIZED);
      
    }
  }

  @Post('refresh') 
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Delete('logout')
  async logout(@Body() body: RefreshTokenDto) {
    return this.authService.logout(body.refreshToken);
  }

  @Get('google/login')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    return this.authService.googleLogin(req)
  }
}
