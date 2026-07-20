import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpamSignal } from './entities/spam-signal.entity';
import { SpamDetectionService } from './spam-detection.service';

@Module({
  imports: [TypeOrmModule.forFeature([SpamSignal])],
  providers: [SpamDetectionService],
  exports: [SpamDetectionService],
})
export class SpamDetectionModule {}
