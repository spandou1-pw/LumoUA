import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FounderProgramService } from './founder-program.service';

@ApiTags('Founder Program')
@ApiBearerAuth()
@Controller('founder-program')
export class FounderProgramController {
  constructor(private readonly founderProgram: FounderProgramService) {}

  @Get('status')
  @ApiOperation({ summary: 'Am I a founder, and how many slots remain' })
  async status(@CurrentUser('id') userId: string) {
    const [isFounder, remainingSlots] = await Promise.all([
      this.founderProgram.isFounder(userId),
      this.founderProgram.remainingSlots(),
    ]);
    return { isFounder, remainingSlots };
  }
}
