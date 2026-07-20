import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafetyFilterTerm } from './entities/safety-filter-term.entity';
import { SafetyFiltersService } from './safety-filters.service';
import { SafetyFiltersAdminController } from './safety-filters-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SafetyFilterTerm])],
  controllers: [SafetyFiltersAdminController],
  providers: [SafetyFiltersService],
  exports: [SafetyFiltersService],
})
export class SafetyFiltersModule {}
