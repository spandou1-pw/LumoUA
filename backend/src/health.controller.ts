import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  check() {
    return { status: 'ok', service: 'edina-backend', time: new Date().toISOString() };
  }
}
