import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { MetricsService } from './metrics.service';

/**
 * doc 37: Prometheus scrape endpoint. Admin-gated rather than fully open —
 * request/error-rate metrics reveal real operational detail (traffic
 * patterns, error rates by route) that shouldn't be publicly world-
 * readable. A real deployment typically instead restricts this at the
 * network level (only the Prometheus scraper's IP can reach it) rather
 * than requiring a JWT a scraper would need to be configured to send —
 * flagged here as the more realistic production setup; the role guard is
 * this codebase's consistent access-control mechanism used as a
 * reasonable stand-in.
 */
@ApiExcludeController()
@Controller('metrics')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  async get(): Promise<string> {
    return this.metrics.metricsText();
  }
}
