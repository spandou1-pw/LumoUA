import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { FakeAccountDetectionService } from '../../src/modules/ai-platform/fake-account-detection/fake-account-detection.service';

describe('FakeAccountDetectionService', () => {
  let service: FakeAccountDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FakeAccountDetectionService,
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn() } },
      ],
    }).compile();
    service = module.get(FakeAccountDetectionService);
  });

  it('gives a low score to a well-established, complete profile', () => {
    const result = service.assess({
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      hasAvatar: true,
      hasBio: true,
      email: 'solomiya.vlasenko@gmail.com',
      followCountSinceSignup: 40,
    });
    expect(result.riskScore).toBeLessThan(20);
  });

  it('flags mass_follow_immediately_after_signup for a brand-new account with a follow burst', () => {
    const result = service.assess({
      createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes old
      hasAvatar: false,
      hasBio: false,
      email: 'user123@example.com',
      followCountSinceSignup: 80,
    });
    expect(result.reasons).toContain('mass_follow_immediately_after_signup');
    expect(result.riskScore).toBeGreaterThanOrEqual(40);
  });

  it('does not flag a normal follow pattern for a new account', () => {
    const result = service.assess({
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      hasAvatar: true,
      hasBio: true,
      email: 'ivan.kovalchuk@gmail.com',
      followCountSinceSignup: 8,
    });
    expect(result.reasons).not.toContain('mass_follow_immediately_after_signup');
    expect(result.reasons).not.toContain('high_follow_velocity_new_account');
  });

  it('caps the risk score at 100 even when multiple signals stack', () => {
    const result = service.assess({
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      hasAvatar: false,
      hasBio: false,
      email: 'a1b2c3d4e5f6a7b8@example.com', // high-entropy hex-looking local part
      followCountSinceSignup: 500,
    });
    expect(result.riskScore).toBeLessThanOrEqual(100);
    expect(result.reasons.length).toBeGreaterThan(1);
  });

  it('does not flag a normal-looking email with no vowels but that is short (avoids false positives on real short handles)', () => {
    const result = service.assess({
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      hasAvatar: true,
      hasBio: true,
      email: 'mkrt@gmail.com', // short, real-looking handle
      followCountSinceSignup: 10,
    });
    expect(result.reasons).not.toContain('generated_looking_email_pattern');
  });
});
