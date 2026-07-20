import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  // doc 23: argon2id hashing happens server-side; this is the raw password
  // in transit over TLS only, never logged (doc 31 redaction interceptor).
  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code must be a 6-digit number' })
  code: string;
}

export class SetUsernameDto {
  @IsString()
  @Matches(/^[a-z0-9_]{3,20}$/, {
    message: 'Username must be 3-20 chars, lowercase letters/digits/underscore only',
  })
  username: string;
}
