import { Body, Controller, Headers, Ip, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto, VerifyEmailDto } from './dto/register.dto';
import { LoginDto, OAuthLoginDto, RefreshTokenDto } from './dto/login.dto';
import { DeviceMeta } from './auth.types';

/** doc SESSIONS.md: a minimal, dependency-free User-Agent parse — just enough to show
 * "Chrome on macOS" / "Safari on iOS" in a session list, not a full UA-parsing library. */
function parseDeviceName(userAgent: string | undefined): string {
  if (!userAgent) return 'Unknown device';
  if (/iPhone|iPad/.test(userAgent)) return 'iOS';
  if (/Android/.test(userAgent)) return 'Android';
  if (/Macintosh/.test(userAgent)) return 'macOS';
  if (/Windows/.test(userAgent)) return 'Windows';
  return 'Unknown device';
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.referralCode);
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Public()
  @Post('verify-email/resend')
  async resend(@Body('email') email: string) {
    await this.authService.resendVerificationCode(email);
    return { sent: true };
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Headers('user-agent') userAgent?: string, @Ip() ip?: string) {
    const deviceMeta: DeviceMeta = { deviceName: parseDeviceName(userAgent), platform: parseDeviceName(userAgent), ipAddress: ip };
    return this.authService.loginWithPassword(dto.email, dto.password, dto.deviceId, deviceMeta);
  }

  @Public()
  @Post('oauth/google')
  async loginGoogle(@Body() dto: OAuthLoginDto, @Headers('user-agent') userAgent?: string, @Ip() ip?: string) {
    // In production: verify dto.idToken against Google's public keys here
    // (or in a dedicated provider-verification service) before ever calling
    // loginWithOAuth — never trust a client-supplied "I logged in" claim
    // (doc 23). Stubbed verification for illustration:
    const { providerUid, email } = await this.verifyGoogleIdTokenStub(dto.idToken);
    const deviceMeta: DeviceMeta = { deviceName: parseDeviceName(userAgent), platform: parseDeviceName(userAgent), ipAddress: ip };
    return this.authService.loginWithOAuth('google', providerUid, email, dto.deviceId, deviceMeta);
  }

  @Public()
  @Post('oauth/apple')
  async loginApple(@Body() dto: OAuthLoginDto) {
    const { providerUid, email } = await this.verifyAppleIdTokenStub(dto.idToken);
    return this.authService.loginWithOAuth('apple', providerUid, email, dto.deviceId);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken, dto.deviceId);
  }

  @Post('logout')
  async logout(@CurrentUser('id') userId: string, @CurrentUser('deviceId') deviceId: string) {
    await this.authService.logout(userId, deviceId);
    return { loggedOut: true };
  }

  @Post('logout-all')
  async logoutAll(@CurrentUser('id') userId: string) {
    await this.authService.logoutAllDevices(userId);
    return { loggedOut: true };
  }

  // --- Stubs: replace with real Google/Apple public-key verification ---
  private async verifyGoogleIdTokenStub(
    _idToken: string,
  ): Promise<{ providerUid: string; email: string }> {
    throw new Error('NOT_IMPLEMENTED: wire up google-auth-library token verification');
  }
  private async verifyAppleIdTokenStub(
    _idToken: string,
  ): Promise<{ providerUid: string; email: string }> {
    throw new Error('NOT_IMPLEMENTED: wire up Apple JWKS token verification');
  }
}
