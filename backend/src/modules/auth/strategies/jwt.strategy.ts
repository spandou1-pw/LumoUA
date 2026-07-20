import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AccessTokenPayload, AuthenticatedUser } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // doc 23: production should use RS256 with an asymmetric key pair so
      // resource servers can verify without calling the auth service. HS256
      // shared-secret is used here for local-dev simplicity; swap
      // JWT_ACCESS_SECRET for JWT_PUBLIC_KEY + algorithms:['RS256'] in prod config.
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') ?? 'dev_only_secret_change_me',
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      deviceId: payload.deviceId,
    };
  }
}
