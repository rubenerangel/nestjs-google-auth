import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';

import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy
  ],
  imports: [UsersModule]
})
export class AuthModule {}
