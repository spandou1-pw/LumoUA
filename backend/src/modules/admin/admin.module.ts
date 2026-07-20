import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { AuditLogController } from './audit-log.controller';
import { SystemHealthController } from './system-health.controller';
import { SecurityAdminController } from './security-admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([AdminAuditLog]), AuthModule],
  controllers: [AuditLogController, SystemHealthController, SecurityAdminController],
})
export class AdminModule {}
