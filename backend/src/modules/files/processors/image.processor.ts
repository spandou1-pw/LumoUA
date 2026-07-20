import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bull';
import { MediaAsset } from '../entities/media-asset.entity';

/**
 * doc 30 image pipeline: on upload, generate a set of responsive sizes
 * (thumbnail / feed-width / full-res) + a blurhash placeholder, off the
 * request path (doc 18 background-job separation principle).
 *
 * Real image resizing (e.g. via `sharp`) and blurhash encoding are omitted
 * here as implementation detail — this processor shows the orchestration:
 * fetch original from R2 -> derive variants -> upload variants -> update
 * the MediaAsset row -> mark ready. Wire in `sharp`/`blurhash` npm packages
 * at the marked TODO points for a real deployment.
 */
@Processor('media-processing')
export class ImageProcessor {
  private readonly logger = new Logger(ImageProcessor.name);

  constructor(@InjectRepository(MediaAsset) private readonly mediaAssets: Repository<MediaAsset>) {}

  @Process('process-image')
  async handle(job: Job<{ assetId: string }>): Promise<void> {
    const { assetId } = job.data;
    const asset = await this.mediaAssets.findOne({ where: { id: assetId } });
    if (!asset) {
      this.logger.warn(`process-image: asset ${assetId} not found, skipping`);
      return;
    }

    try {
      // TODO(real deployment): download original from R2 via storageKey,
      // run through `sharp` to produce thumb (320w) / feed (960w) / full
      // (2048w max) variants, encode a blurhash from a small downscale,
      // upload each variant back to R2 alongside the original.
      const variants = {
        thumb: asset.storageKey.replace(/(\.\w+)$/, '-thumb$1'),
        feed: asset.storageKey.replace(/(\.\w+)$/, '-feed$1'),
        full: asset.storageKey,
      };

      asset.variants = variants;
      asset.blurhash = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4'; // placeholder — real value from encoder
      asset.status = 'ready';
      await this.mediaAssets.save(asset);
    } catch (err) {
      this.logger.error(`process-image failed for ${assetId}`, err as Error);
      asset.status = 'failed';
      await this.mediaAssets.save(asset);
      throw err; // let Bull's retry/backoff (doc 18) handle it
    }
  }
}
