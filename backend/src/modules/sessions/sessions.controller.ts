import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionsService } from './sessions.service';

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List your active device sessions (doc 04 AUTH-7)' })
  async list(@CurrentUser('id') userId: string) {
    return this.sessionsService.listActiveSessions(userId);
  }

  @Delete(':deviceId')
  @ApiOperation({ summary: 'Revoke a specific device session — remote logout for just that device' })
  async revoke(@CurrentUser('id') userId: string, @Param('deviceId') deviceId: string) {
    await this.sessionsService.revokeSession(userId, deviceId);
    return { revoked: true };
  }
}
