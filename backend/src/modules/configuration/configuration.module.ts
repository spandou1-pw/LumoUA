import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfiguration } from './entities/system-configuration.entity';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';
import { ConfigurationService } from './configuration.service';
import { ConfigurationAdminController } from './configuration.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfiguration, AdminAuditLog])],
  controllers: [ConfigurationAdminController],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
