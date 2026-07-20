import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { CommunitiesAdminController } from './communities-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Community, CommunityMember, AdminAuditLog])],
  controllers: [CommunitiesController, CommunitiesAdminController],
  providers: [CommunitiesService],
  exports: [CommunitiesService],
})
export class CommunitiesModule {}
