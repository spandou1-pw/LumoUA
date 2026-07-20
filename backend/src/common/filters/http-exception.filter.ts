import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Standard error envelope per doc 22:
 * { "error": { "code": "STRING_CODE", "message": "...", "details": {...} } }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Something went wrong. Please try again.';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        code = exception.name.replace('Exception', '').toUpperCase();
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        message = (b.message as string) ?? message;
        code = (b.code as string) ?? exception.name.replace('Exception', '').toUpperCase();
        details = b.details;
      }
    } else if (exception instanceof Error) {
      // Never leak internal error messages/stack traces to clients (doc 31) —
      // logged server-side only, generic message returned to the caller.
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      error: { code, message, ...(details ? { details } : {}) },
    });
  }
}
