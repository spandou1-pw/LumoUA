import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle(); // doc: WebSocket/GraphQL contexts skip HTTP-shaped labels here; a full deployment would add parallel counters for those transports

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const start = process.hrtime.bigint();
    // doc 37: route template (e.g. '/posts/:id'), not the raw URL with real
    // ids interpolated — keeps cardinality bounded (a runaway label
    // cardinality is a classic way to quietly break a metrics backend).
    const route = req.route?.path ?? req.url;

    return next.handle().pipe(
      tap({
        next: () => this.record(req.method, route, res.statusCode, start),
        error: () => this.record(req.method, route, res.statusCode || 500, start),
      }),
    );
  }

  private record(method: string, route: string, status: number, startNs: bigint): void {
    const durationSeconds = Number(process.hrtime.bigint() - startNs) / 1e9;
    const labels = { method, route, status: String(status) };
    this.metrics.httpRequestsTotal.inc(labels);
    this.metrics.httpRequestDuration.observe(labels, durationSeconds);
  }
}
