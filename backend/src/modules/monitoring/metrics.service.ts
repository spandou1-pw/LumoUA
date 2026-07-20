import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

/**
 * doc 37: RED method (Rate, Errors, Duration) per endpoint — this is a
 * real `prom-client` registry, not a placeholder. `collectDefaultMetrics`
 * also pulls in real Node.js process metrics (heap, event-loop lag, GC)
 * for free, which matters for the "is the app actually meeting its
 * performance NFRs" monitoring doc 05/37 call for.
 */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  readonly httpRequestsTotal = new Counter({
    name: 'edina_http_requests_total',
    help: 'Total HTTP requests, labeled by method/route/status',
    labelNames: ['method', 'route', 'status'],
    registers: [this.registry],
  });

  readonly httpRequestDuration = new Histogram({
    name: 'edina_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [this.registry],
  });

  readonly backgroundJobsTotal = new Counter({
    name: 'edina_background_jobs_total',
    help: 'Background job completions, labeled by queue/status',
    labelNames: ['queue', 'status'],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  async metricsText(): Promise<string> {
    return this.registry.metrics();
  }
}
