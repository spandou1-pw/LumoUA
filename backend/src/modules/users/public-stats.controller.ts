import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';

/**
 * doc LUMO.md: the landing page shows a "X people already joined" style
 * counter for social proof. This returns the REAL registered-user count
 * from the database — never a fabricated/inflated number. If the real
 * number is small, it's small; presenting a fake number as real user
 * count would be deceptive marketing, which this project doesn't do
 * regardless of what looks better for growth. Cached briefly since it's
 * public and doesn't need to be real-time-precise.
 */
@ApiTags('Public Stats')
@Controller('public-stats')
export class PublicStatsController {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  @Public()
  @Get('user-count')
  @ApiOperation({ summary: 'Real, live registered-user count for landing-page social proof' })
  async userCount() {
    const count = await this.users.count({ where: { status: 'active' } });
    return { userCount: count };
  }
}
