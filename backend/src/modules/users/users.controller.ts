import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users/me')
  async me(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('users/me')
  async updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('users/:username')
  async getProfile(@CurrentUser('id') viewerId: string, @Param('username') username: string) {
    return this.usersService.getPublicProfile(viewerId, username);
  }

  @Post('users/:id/follow')
  async followUser(@CurrentUser('id') me: string, @Param('id') id: string) {
    await this.usersService.follow(me, id);
    return { following: true };
  }

  @Delete('users/:id/follow')
  async unfollowUser(@CurrentUser('id') me: string, @Param('id') id: string) {
    await this.usersService.unfollow(me, id);
    return { following: false };
  }

  @Post('users/:id/block')
  async blockUser(@CurrentUser('id') me: string, @Param('id') id: string) {
    await this.usersService.block(me, id);
    return { blocked: true };
  }

  @Delete('users/:id/block')
  async unblockUser(@CurrentUser('id') me: string, @Param('id') id: string) {
    await this.usersService.unblock(me, id);
    return { blocked: false };
  }

  @Post('users/:id/mute')
  async muteUser(@CurrentUser('id') me: string, @Param('id') id: string) {
    await this.usersService.mute(me, id);
    return { muted: true };
  }

  @Delete('users/:id/mute')
  async unmuteUser(@CurrentUser('id') me: string, @Param('id') id: string) {
    await this.usersService.unmute(me, id);
    return { muted: false };
  }

  @Post('friend-requests')
  async sendFriendRequest(@CurrentUser('id') me: string, @Body('addresseeId') addresseeId: string) {
    return this.usersService.sendFriendRequest(me, addresseeId);
  }

  @Patch('friend-requests/:id')
  async respondFriendRequest(
    @CurrentUser('id') me: string,
    @Param('id') id: string,
    @Body('accept') accept: boolean,
  ) {
    return this.usersService.respondToFriendRequest(id, me, accept);
  }
}
