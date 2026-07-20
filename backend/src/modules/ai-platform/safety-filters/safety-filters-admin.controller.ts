import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PlatformRole } from '../../../common/enums/role.enum';
import { SafetyFilterTerm } from './entities/safety-filter-term.entity';
import { SafetyFiltersService } from './safety-filters.service';

@ApiTags('Admin — Safety Filters')
@ApiBearerAuth()
@Controller('admin/safety-filters')
@UseGuards(RolesGuard)
@Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN) // doc 24: term-list curation is a triage/tooling task, moderator-level like report resolution
export class SafetyFiltersAdminController {
  constructor(
    @InjectRepository(SafetyFilterTerm) private readonly terms: Repository<SafetyFilterTerm>,
    private readonly safetyFilters: SafetyFiltersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all filter terms' })
  async list() {
    return this.terms.find({ order: { category: 'ASC' } });
  }

  @Post()
  @ApiOperation({ summary: 'Add a filter term or pattern' })
  async create(@Body() dto: Partial<SafetyFilterTerm>) {
    const saved = await this.terms.save(this.terms.create(dto));
    await this.safetyFilters.invalidateCache();
    return saved;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update or deactivate a term' })
  async update(@Param('id') id: string, @Body() dto: Partial<SafetyFilterTerm>) {
    await this.terms.update({ id }, dto);
    await this.safetyFilters.invalidateCache();
    return this.terms.findOne({ where: { id } });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a term' })
  async remove(@Param('id') id: string) {
    await this.terms.delete({ id });
    await this.safetyFilters.invalidateCache();
    return { deleted: true };
  }
}
