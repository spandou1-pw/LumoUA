import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bull';
import { MediaAsset } from '../entities/media-asset.entity';

/**
 * doc 30 video pipeline (Phase 2, POST-3): transcode to adaptive-bitrate
 * (HLS/DASH) renditions + extract a thumbnail. Provider decision (Cloudflare
 * Stream vs self-hosted FFmpeg worker) explicitly deferred to Phase 2
 * kickoff per doc 30 — this processor is the orchestration shell either
 * choice plugs into.
 */
@Processor('media-processing')
export class VideoProcessor {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(@InjectRepository(MediaAsset) private readonly mediaAssets: Repository<MediaAsset>) {}

  @Process('transcode-video')
  async handle(job: Job<{ assetId: string }>): Promise<void> {
    const { assetId } = job.data;
    const asset = await this.mediaAssets.findOne({ where: { id: assetId } });
    if (!asset) {
      this.logger.warn(`transcode-video: asset ${assetId} not found, skipping`);
      return;
    }

    try {
      // TODO(Phase 2 kickoff): call the chosen transcoding provider,
      // producing HLS/DASH renditions + a first-frame or designated-timestamp
      // thumbnail (same blurhash-placeholder pattern as images, doc 30).
      asset.playbackManifestKey = asset.storageKey.replace(/\.\w+$/, '/master.m3u8');
      asset.blurhash = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';
      asset.status = 'ready';
      await this.mediaAssets.save(asset);
    } catch (err) {
      this.logger.error(`transcode-video failed for ${assetId}`, err as Error);
      asset.status = 'failed';
      await this.mediaAssets.save(asset);
      throw err;
    }
  }
}
