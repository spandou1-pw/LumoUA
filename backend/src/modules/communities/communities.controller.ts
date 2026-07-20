import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto, UpdateCommunityDto } from './dto/community.dto';
import { CommunityMemberRole } from './entities/community-member.entity';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateCommunityDto) {
    return this.communitiesService.create(userId, dto);
  }

  @Get(':slug')
  async get(@Param('slug') slug: string) {
    return this.communitiesService.getBySlug(slug);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCommunityDto,
  ) {
    return this.communitiesService.update(id, userId, dto);
  }

  @Post(':id/join')
  async join(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.communitiesService.join(id, userId);
    return { joined: true };
  }

  @Delete(':id/join')
  async leave(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.communitiesService.leave(id, userId);
    return { joined: false };
  }

  @Get(':id/members')
  async members(@Param('id') id: string) {
    return this.communitiesService.listMembers(id);
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
  ) {
    await this.communitiesService.removeMember(id, actorId, targetUserId);
    return { removed: true };
  }

  @Patch(':id/members/:userId/role')
  async assignRole(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Body('role') role: CommunityMemberRole,
  ) {
    await this.communitiesService.assignCommunityRole(id, actorId, targetUserId, role);
    return { updated: true };
  }
}
