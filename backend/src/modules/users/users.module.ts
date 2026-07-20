import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Follow } from './entities/follow.entity';
import { Block } from './entities/block.entity';
import { Mute } from './entities/mute.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PublicStatsController } from './public-stats.controller';
import { UsersAdminController } from './users-admin.controller';
import { PolicyService } from './policy.service';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Follow, Block, Mute, FriendRequest, AdminAuditLog])],
  controllers: [UsersController, PublicStatsController, UsersAdminController],
  providers: [UsersService, PolicyService],
  // PolicyService exported: messages/communities modules reuse it (doc 24 —
  // one shared policy service, not reimplemented per-module).
  exports: [UsersService, PolicyService, TypeOrmModule],
})
export class UsersModule {}
