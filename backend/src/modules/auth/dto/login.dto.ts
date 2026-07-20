import { IsEmail, IsIn, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  // Client-generated stable device identifier (doc 23: refresh tokens scoped per device).
  @IsString()
  deviceId: string;
}

export class OAuthLoginDto {
  @IsIn(['google', 'apple'])
  provider: 'google' | 'apple';

  // Provider ID token — verified server-side against the provider, never
  // trusted at face value (doc 23).
  @IsString()
  idToken: string;

  @IsString()
  deviceId: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;

  @IsString()
  deviceId: string;
}
