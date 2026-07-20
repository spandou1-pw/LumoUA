import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Experiment } from './entities/experiment.entity';
import { ExperimentEvent } from './entities/experiment-event.entity';
import { AbTestingService } from './ab-testing.service';
import { AbTestingController, AbTestingAdminController } from './ab-testing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Experiment, ExperimentEvent])],
  controllers: [AbTestingController, AbTestingAdminController],
  providers: [AbTestingService],
  exports: [AbTestingService],
})
export class AbTestingModule {}
