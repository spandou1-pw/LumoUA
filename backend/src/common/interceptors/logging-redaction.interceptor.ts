import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/**
 * Structured request logging with field redaction (doc 31/37).
 * ciphertext / password / token fields are never written to logs, even
 * though ciphertext is already encrypted — defense in depth against
 * accidentally logging plaintext upstream of encryption in a future bug.
 */
const REDACTED_FIELDS = new Set([
  'password',
  'ciphertext',
  'ciphertextMeta',
  'accessToken',
  'refreshToken',
  'identityKey',
  'signedPrekey',
  'oneTimePrekeys',
]);

function redact(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const clone: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const key of Object.keys(clone)) {
    if (REDACTED_FIELDS.has(key)) clone[key] = '[REDACTED]';
  }
  return clone;
}

@Injectable()
export class LoggingRedactionInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const start = Date.now();
    const { method, url } = req;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            JSON.stringify({
              method,
              url,
              status: 'ok',
              durationMs: Date.now() - start,
              body: redact(req.body),
            }),
          );
        },
        error: (err) => {
          this.logger.warn(
            JSON.stringify({
              method,
              url,
              status: 'error',
              durationMs: Date.now() - start,
              body: redact(req.body),
              errorName: err?.name,
            }),
          );
        },
      }),
    );
  }
}
