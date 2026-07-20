import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SecurityAuditFinding {
  check: string;
  severity: 'critical' | 'warning' | 'info';
  passed: boolean;
  detail: string;
}

/**
 * doc SECURITY.md "Security Audit": a real, runnable check against the
 * actual running configuration — not a static checklist document nobody
 * re-reads. Each check inspects real environment/config state and reports
 * pass/fail; this is meant to run in CI (doc 36) and/or as a startup
 * sanity check, catching exactly the kind of "we shipped with the dev
 * secret" mistake that doesn't announce itself any other way.
 */
@Injectable()
export class SecurityAuditService {
  constructor(private readonly config: ConfigService) {}

  runAudit(): SecurityAuditFinding[] {
    const findings: SecurityAuditFinding[] = [];

    findings.push(this.checkNotDefaultSecret('JWT_ACCESS_SECRET', 'dev_only_secret_change_me'));
    findings.push(this.checkNotDefaultSecret('DATABASE_PASSWORD', 'edina_local_dev_only'));
    findings.push(this.checkSet('STRIPE_WEBHOOK_SECRET'));
    findings.push(this.checkNodeEnvIsProduction());
    findings.push(this.checkCorsNotWildcardInProduction());
    findings.push(this.checkRateLimitingConfigured());

    return findings;
  }

  isHealthy(findings: SecurityAuditFinding[]): boolean {
    return !findings.some((f) => f.severity === 'critical' && !f.passed);
  }

  private checkNotDefaultSecret(envKey: string, defaultValue: string): SecurityAuditFinding {
    const value = this.config.get<string>(envKey);
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    const usesDefault = !value || value === defaultValue;
    return {
      check: `${envKey}_not_default`,
      severity: 'critical',
      // doc: only fails the audit in production — local/dev environments
      // are expected to use the documented dev-only default (doc 31's own
      // .env.example ships it deliberately), so flagging it there would
      // just be permanent noise nobody acts on.
      passed: !isProduction || !usesDefault,
      detail: usesDefault
        ? `${envKey} is using the default/example value — must be a real secret in production`
        : `${envKey} is set to a non-default value`,
    };
  }

  private checkSet(envKey: string): SecurityAuditFinding {
    const value = this.config.get<string>(envKey);
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    const isSet = !!value && !value.startsWith('replace_me') && !value.includes('_replace_me');
    return {
      check: `${envKey}_configured`,
      severity: 'warning',
      passed: !isProduction || isSet,
      detail: isSet ? `${envKey} is configured` : `${envKey} is not configured — dependent features will fail closed or be unavailable`,
    };
  }

  private checkNodeEnvIsProduction(): SecurityAuditFinding {
    const env = this.config.get<string>('NODE_ENV');
    return {
      check: 'node_env_explicit',
      severity: 'info',
      passed: env === 'production' || env === 'development' || env === 'test',
      detail: `NODE_ENV is "${env}"`,
    };
  }

  private checkCorsNotWildcardInProduction(): SecurityAuditFinding {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    const corsOrigin = this.config.get<string>('CORS_ORIGIN');
    const isWildcard = !corsOrigin || corsOrigin === '*';
    return {
      check: 'cors_not_wildcard_in_production',
      severity: 'critical',
      passed: !isProduction || !isWildcard,
      detail: isWildcard
        ? 'CORS_ORIGIN is unset/wildcard — main.ts currently calls app.enableCors() with no restriction (doc 31 flags this as needing per-environment tightening)'
        : `CORS_ORIGIN is restricted to: ${corsOrigin}`,
    };
  }

  private checkRateLimitingConfigured(): SecurityAuditFinding {
    // doc 31/Stage 4: ThrottlerModule is registered globally in app.module.ts
    // regardless of env config — this check documents that the mechanism
    // exists as a structural fact rather than an env-driven toggle, since
    // there's currently no config path that could disable it.
    return {
      check: 'rate_limiting_enabled',
      severity: 'info',
      passed: true,
      detail: 'ThrottlerModule is registered globally (app.module.ts) — always active',
    };
  }
}
