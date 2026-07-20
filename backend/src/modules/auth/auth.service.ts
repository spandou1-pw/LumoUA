import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { User } from '../users/entities/user.entity';
import { AuthIdentity } from './entities/auth-identity.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { EmailVerificationCode } from './entities/email-verification-code.entity';
import { PlatformRole } from '../../common/enums/role.enum';
import { AccessTokenPayload, DeviceMeta } from './auth.types';

const REFRESH_TOKEN_TTL_DAYS = 30;
const VERIFICATION_CODE_TTL_MINUTES = 15;

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AuthIdentity) private readonly authIdentities: Repository<AuthIdentity>,
    @InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>,
    @InjectRepository(EmailVerificationCode)
    private readonly verificationCodes: Repository<EmailVerificationCode>,
    private readonly jwt: JwtService,
    private readonly events: EventEmitter2,
  ) {}

  // ---------- Registration (doc 08 flow 1, AUTH-1) ----------

  async register(email: string, password: string, referralCode?: string): Promise<{ userId: string }> {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      // doc 08 edge case: duplicate email routes to a clear, specific error —
      // never a generic 500, and never silently logs the person in as the
      // existing account (that would be an account-takeover vector).
      throw new ConflictException({
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    // Temporary placeholder username/displayName — replaced in the
    // "choose username" onboarding step (doc 08 flow 1 step 4); using a
    // short random suffix here keeps the unique constraint satisfied
    // in the meantime without colliding.
    const placeholderUsername = `user_${uuid().slice(0, 8)}`;

    const user = await this.users.save(
      this.users.create({
        email,
        passwordHash,
        username: placeholderUsername,
        displayName: placeholderUsername,
        role: PlatformRole.USER,
      }),
    );

    await this.authIdentities.save(
      this.authIdentities.create({ userId: user.id, provider: 'email', providerUid: null }),
    );

    await this.issueVerificationCode(user.id);

    // doc GROWTH.md: referral qualification/founder-program eligibility
    // listen for this event rather than AuthService knowing about either
    // feature directly — keeps Auth foundational and dependency-free of
    // growth features built on top of it.
    this.events.emit('user.registered', { userId: user.id, referralCode });

    return { userId: user.id };
  }

  private async issueVerificationCode(userId: string): Promise<string> {
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    await this.verificationCodes.save(
      this.verificationCodes.create({
        userId,
        codeHash: sha256(code),
        expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000),
      }),
    );
    // doc 25/31: the code itself is never returned in any API response —
    // that would be a real account-takeover hole in production (anyone
    // could register with your email and read the code back). Dispatch is
    // via a real email provider in production (not wired — see
    // LAUNCH_READINESS.md's stubbed-providers table). For local
    // development ONLY, with no email provider configured, the code is
    // logged to the server console so registration can actually be tested
    // end-to-end — gated strictly behind NODE_ENV !== 'production' so this
    // can never leak into a real deployment's logs.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[DEV ONLY] Email verification code for user ${userId}: ${code}`);
    }
    return code;
  }

  async verifyEmail(email: string, code: string): Promise<{ verified: boolean }> {
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new BadRequestException('INVALID_CODE');

    const record = await this.verificationCodes.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
    if (!record || record.consumedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('CODE_EXPIRED_OR_INVALID');
    }
    if (record.codeHash !== sha256(code)) {
      throw new BadRequestException('CODE_EXPIRED_OR_INVALID');
    }

    record.consumedAt = new Date();
    await this.verificationCodes.save(record);

    user.emailVerifiedAt = new Date();
    await this.users.save(user);

    this.events.emit('user.email_verified', { userId: user.id });

    return { verified: true };
  }

  async resendVerificationCode(email: string): Promise<void> {
    const user = await this.users.findOne({ where: { email } });
    if (!user || user.emailVerifiedAt) return; // don't reveal account existence either way
    await this.issueVerificationCode(user.id);
  }

  // ---------- Login (doc 23) ----------

  async loginWithPassword(
    email: string,
    password: string,
    deviceId: string,
    deviceMeta?: DeviceMeta,
  ) {
    const user = await this.users.findOne({
      where: { email },
      select: ['id', 'email', 'username', 'role', 'passwordHash', 'status'],
    });
    // Same generic error for "no such user" and "wrong password" —
    // doesn't leak which part was wrong (credential-stuffing resistance, doc 31).
    if (!user || !user.passwordHash || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
    if (user.status !== 'active') {
      throw new UnauthorizedException('ACCOUNT_NOT_ACTIVE');
    }
    return this.issueTokenPair(user, deviceId, deviceMeta);
  }

  /**
   * doc 23: OAuth ID token verified server-side against the provider.
   * Provider-specific verification (Google/Apple public key sets) is a
   * separate, focused module in a real deployment — stubbed here as the
   * integration point, deliberately not faked as "always valid".
   */
  async loginWithOAuth(
    provider: 'google' | 'apple',
    verifiedProviderUid: string,
    verifiedEmail: string,
    deviceId: string,
    deviceMeta?: DeviceMeta,
  ) {
    let identity = await this.authIdentities.findOne({
      where: { provider, providerUid: verifiedProviderUid },
    });

    if (identity) {
      const user = await this.users.findOneOrFail({ where: { id: identity.userId } });
      return this.issueTokenPair(user, deviceId, deviceMeta);
    }

    // doc 23/08: an OAuth email matching an existing email/password account
    // is NEVER auto-merged — explicit account-linking step required instead.
    const existingByEmail = await this.users.findOne({ where: { email: verifiedEmail } });
    if (existingByEmail) {
      throw new ConflictException({
        code: 'ACCOUNT_LINK_REQUIRED',
        message:
          'An account with this email already exists. Log in with your password first to link this provider.',
      });
    }

    const placeholderUsername = `user_${uuid().slice(0, 8)}`;
    const user = await this.users.save(
      this.users.create({
        email: verifiedEmail,
        username: placeholderUsername,
        displayName: placeholderUsername,
        emailVerifiedAt: new Date(), // provider already verified ownership
        role: PlatformRole.USER,
      }),
    );
    identity = await this.authIdentities.save(
      this.authIdentities.create({ userId: user.id, provider, providerUid: verifiedProviderUid }),
    );

    return this.issueTokenPair(user, deviceId, deviceMeta);
  }

  // ---------- Token issuance / rotation (doc 23) ----------

  private async issueTokenPair(user: User, deviceId: string, deviceMeta?: DeviceMeta) {
    const payload: AccessTokenPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      deviceId,
    };
    const accessToken = this.jwt.sign(payload);

    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId: user.id,
        deviceId,
        deviceName: deviceMeta?.deviceName ?? null,
        platform: deviceMeta?.platform ?? null,
        ipAddress: deviceMeta?.ipAddress ?? null,
        lastUsedAt: new Date(),
        tokenHash: sha256(rawRefreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      }),
    );

    return { accessToken, refreshToken: rawRefreshToken, userId: user.id };
  }

  /**
   * doc 23: refresh tokens rotate on every use. Reuse of an already-rotated
   * token (replacedByTokenHash already set) is a theft signal — the whole
   * device's session chain is invalidated, not just the one token.
   */
  async refresh(rawRefreshToken: string, deviceId: string, deviceMeta?: DeviceMeta) {
    const tokenHash = sha256(rawRefreshToken);
    const record = await this.refreshTokens.findOne({ where: { tokenHash } });

    if (!record || record.deviceId !== deviceId) {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    }

    if (record.revokedAt || record.replacedByTokenHash) {
      // Reuse detected — nuke every active token for this user+device.
      await this.refreshTokens.update(
        { userId: record.userId, deviceId: record.deviceId, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
      throw new UnauthorizedException('REFRESH_TOKEN_REUSE_DETECTED');
    }

    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException('REFRESH_TOKEN_EXPIRED');
    }

    const user = await this.users.findOneOrFail({ where: { id: record.userId } });
    const issued = await this.issueTokenPair(user, deviceId, deviceMeta);

    record.replacedByTokenHash = sha256(issued.refreshToken);
    record.revokedAt = new Date();
    await this.refreshTokens.save(record);

    return issued;
  }

  async logout(userId: string, deviceId: string): Promise<void> {
    await this.refreshTokens.update(
      { userId, deviceId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  /** doc 23: "log out of all devices" — Phase 1 security floor, not deferred. */
  async logoutAllDevices(userId: string): Promise<void> {
    await this.refreshTokens.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }
}
