import { Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { User } from '../users/entities/user.entity';
import { Auth, google } from 'googleapis';

import { UsersService } from '../users/users.service';
import RefreshToken from './entities/refresh-token.entity';

@Injectable()
export class AuthService {
  private refreshTokens: RefreshToken[] = [];
  private oauthClient: Auth.OAuth2Client;

  constructor(private readonly userService: UsersService) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.oauthClient = new google.auth.OAuth2(clientId, clientSecret);
  }

  async loginGoogleUser(
    token: string,
    values: {userAgent: string, ipAddress: string}
  ): Promise<{accessToken: string, refreshToken: string} | undefined>{
    try {
      const tokenInfo = await this.oauthClient.getTokenInfo(token);
      console.log(tokenInfo, 'tokenInfo');
      const user = await this.userService.findByEmail(tokenInfo.email);
      if (user) {
        return this.newRefreshAndAccessToken(user, values)
      }
      return undefined;
    } catch (e) {
      console.log(e);
    }
    
  }

  async refresh(refreshStr: string): Promise<string | undefined>{
    const refreshToken = await this.retrieveRefreshToken(refreshStr);
    
    if (!refreshToken) {
      return undefined;
    }

    const user = await this.userService.findOne(refreshToken.userId);
    if (!user) {
      return undefined;
    }

    const accessToken = {
      userId: refreshToken.userId
    };

    return sign(accessToken, process.env.ACCESS_SECRET, {expiresIn: '1h'});
  }

  private retrieveRefreshToken(
    refreshStr: string
  ): Promise<RefreshToken | undefined>{
    try {
      const decoded = verify(refreshStr, process.env.REFRESH_SECRET );
      
      if (typeof decoded === 'string') {
        return undefined;
      }

      return Promise.resolve(
        this.refreshTokens.find((token) => token.id === decoded.id),
      );
    } catch (e) {
      return undefined;
    }
  }

  async login(
    email: string,
    password: string,
    values: { userAgent: string; ipAddress: string },
  ): Promise<{ accessToken: string; refreshToken: string } | undefined> {
    const user = await this.userService.findByEmail(email);
    
    if (!user) {
      return undefined;
    }

    // verify your user -- use argon2 for password hasing!!
    if (user.password !== password) {
      return undefined;
    }

    return this.newRefreshAndAccessToken(user, values);
  }


   

  private async newRefreshAndAccessToken(
    user: User,
    values: { userAgent: string; ipAddress: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshObject = new RefreshToken({
      id:
        this.refreshTokens.length === 0
          ? 0
          : this.refreshTokens[this.refreshTokens.length - 1].id + 1,
      ...values,
      userId: user.id,
    });

    this.refreshTokens.push(refreshObject);

    return {
      accessToken: sign(
        { 
          userId: user.id 
        }, 
        process.env.ACCESS_SECRET, 
        {
          expiresIn: '1h',
        }
      ),
      refreshToken: refreshObject.sign(),
    };
  }

  async logout(refreshStr): Promise<void> {
    const refreshToken = await this.retrieveRefreshToken(refreshStr);

    if (!refreshToken) {
      return;
    }

    // Delete refreshToken from DB
    this.refreshTokens = this.refreshTokens.filter(
      (refreshtoken) => refreshtoken.id !== refreshToken.id,
    )
  }

  googleLogin(req) {
    if (!req.user) {
      return 'No user from google'
    }

    return {
      message: 'User information from google',
      user: req.user
    }
  }
}
