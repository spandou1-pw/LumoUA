import { Module } from '@nestjs/common';
import { FakeAccountDetectionService } from './fake-account-detection.service';

@Module({
  providers: [FakeAccountDetectionService],
  exports: [FakeAccountDetectionService],
})
export class FakeAccountDetectionModule {}
