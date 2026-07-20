import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SecurityAuditService } from '../../src/modules/security-audit/security-audit.service';

describe('SecurityAuditService', () => {
  async function buildService(env: Record<string, string>): Promise<SecurityAuditService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityAuditService,
        { provide: ConfigService, useValue: { get: (key: string) => env[key] } },
      ],
    }).compile();
    return module.get(SecurityAuditService);
  }

  it('fails the default-secret check in production when JWT_ACCESS_SECRET is left at its default', async () => {
    const service = await buildService({ NODE_ENV: 'production', JWT_ACCESS_SECRET: 'dev_only_secret_change_me' });
    const findings = service.runAudit();
    const jwtFinding = findings.find((f) => f.check === 'JWT_ACCESS_SECRET_not_default');
    expect(jwtFinding?.passed).toBe(false);
    expect(service.isHealthy(findings)).toBe(false);
  });

  it('passes the default-secret check in production when a real secret is set', async () => {
    const service = await buildService({ NODE_ENV: 'production', JWT_ACCESS_SECRET: 'a-real-random-production-secret' });
    const findings = service.runAudit();
    const jwtFinding = findings.find((f) => f.check === 'JWT_ACCESS_SECRET_not_default');
    expect(jwtFinding?.passed).toBe(true);
  });

  it('does not fail the default-secret check outside production (dev default is expected there)', async () => {
    const service = await buildService({ NODE_ENV: 'development', JWT_ACCESS_SECRET: 'dev_only_secret_change_me' });
    const findings = service.runAudit();
    const jwtFinding = findings.find((f) => f.check === 'JWT_ACCESS_SECRET_not_default');
    expect(jwtFinding?.passed).toBe(true);
  });

  it('fails the CORS check in production when CORS_ORIGIN is unset (wildcard)', async () => {
    const service = await buildService({ NODE_ENV: 'production' });
    const findings = service.runAudit();
    const corsFinding = findings.find((f) => f.check === 'cors_not_wildcard_in_production');
    expect(corsFinding?.passed).toBe(false);
  });

  it('passes the CORS check in production when CORS_ORIGIN is explicitly set', async () => {
    const service = await buildService({ NODE_ENV: 'production', CORS_ORIGIN: 'https://edina.ua' });
    const findings = service.runAudit();
    const corsFinding = findings.find((f) => f.check === 'cors_not_wildcard_in_production');
    expect(corsFinding?.passed).toBe(true);
  });

  it('isHealthy is false if any critical check fails, regardless of warning/info checks', async () => {
    const service = await buildService({ NODE_ENV: 'production' }); // CORS + secrets all fail
    const findings = service.runAudit();
    expect(service.isHealthy(findings)).toBe(false);
  });

  it('isHealthy is true when all critical checks pass, even if a warning-level check fails', async () => {
    const service = await buildService({
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: 'real-secret',
      DATABASE_PASSWORD: 'real-db-password',
      CORS_ORIGIN: 'https://edina.ua',
      // STRIPE_WEBHOOK_SECRET intentionally left unset — a warning, not critical
    });
    const findings = service.runAudit();
    expect(service.isHealthy(findings)).toBe(true);
  });
});
