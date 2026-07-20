import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { MediaAsset } from './entities/media-asset.entity';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ImageProcessor } from './processors/image.processor';
import { VideoProcessor } from './processors/video.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaAsset]),
    BullModule.registerQueue({ name: 'media-processing' }),
  ],
  controllers: [FilesController],
  providers: [FilesService, ImageProcessor, VideoProcessor],
  exports: [FilesService],
})
export class FilesModule {}
