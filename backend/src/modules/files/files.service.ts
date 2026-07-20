import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuid } from 'uuid';
import { MediaAsset, MediaOwnerType } from './entities/media-asset.entity';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';

const IMAGE_SIZE_CAP = 15 * 1024 * 1024; // 15MB
const VIDEO_SIZE_CAP = 200 * 1024 * 1024; // 200MB
const UPLOAD_URL_TTL_SECONDS = 300;
const ORPHAN_CLEANUP_AGE_HOURS = 24; // doc 30: unreferenced uploads older than this are purged

@Injectable()
export class FilesService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(
    @InjectRepository(MediaAsset) private readonly mediaAssets: Repository<MediaAsset>,
    @InjectQueue('media-processing') private readonly mediaQueue: Queue,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.get<string>('STORAGE_BUCKET') ?? 'edina-media-dev';
    this.publicBaseUrl = this.config.get<string>('STORAGE_PUBLIC_BASE_URL') ?? 'https://cdn.edina.ua';
    this.s3 = new S3Client({
      region: this.config.get<string>('STORAGE_REGION') ?? 'auto',
      endpoint: this.config.get<string>('STORAGE_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.get<string>('STORAGE_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.config.get<string>('STORAGE_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  /** doc 22 POST /media/upload-url, doc 30 upload flow steps 1-2. */
  async createUploadUrl(uploaderId: string, dto: RequestUploadUrlDto) {
    const isVideo = dto.contentType.startsWith('video/');
    const cap = isVideo ? VIDEO_SIZE_CAP : IMAGE_SIZE_CAP;
    if (dto.contentLengthBytes > cap) {
      throw new BadRequestException(
        `FILE_TOO_LARGE: ${isVideo ? 'video' : 'image'} exceeds ${cap} bytes`,
      );
    }
    // doc 30: avatar/cover get stricter limits — infrequent by nature.
    if ((dto.ownerType === 'avatar' || dto.ownerType === 'cover') && dto.contentLengthBytes > 8 * 1024 * 1024) {
      throw new BadRequestException('FILE_TOO_LARGE: avatar/cover limited to 8MB');
    }

    const assetId = uuid();
    const ext = dto.contentType.split('/')[1];
    // doc 30 key structure: {env}/{entity_type}/{entity_id}/{asset_id}.{ext}
    // entity_id unknown until the owning post/etc. exists, so uploads land
    // in a per-uploader staging prefix and are moved/re-keyed on attach.
    const env = this.config.get<string>('NODE_ENV') ?? 'development';
    const storageKey = `${env}/staging/${uploaderId}/${assetId}.${ext}`;

    const asset = await this.mediaAssets.save(
      this.mediaAssets.create({
        uploaderId,
        ownerType: dto.ownerType as MediaOwnerType,
        ownerId: null,
        mediaType: isVideo ? 'video' : 'image',
        storageKey,
        status: 'pending',
        position: dto.position ?? 0,
      }),
    );

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: dto.contentType,
      ContentLength: dto.contentLengthBytes,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: UPLOAD_URL_TTL_SECONDS });

    return { assetId: asset.id, uploadUrl, storageKey, expiresInSeconds: UPLOAD_URL_TTL_SECONDS };
  }

  /**
   * Client calls this after the direct-to-R2 upload completes (doc 30 step 3).
   * Enqueues responsive-size generation (image) or transcoding (video).
   */
  async confirmUpload(uploaderId: string, assetId: string): Promise<MediaAsset> {
    const asset = await this.mediaAssets.findOne({ where: { id: assetId } });
    if (!asset) throw new NotFoundException('ASSET_NOT_FOUND');
    if (asset.uploaderId !== uploaderId) throw new NotFoundException('ASSET_NOT_FOUND');

    asset.status = 'processing';
    await this.mediaAssets.save(asset);

    await this.mediaQueue.add(
      asset.mediaType === 'video' ? 'transcode-video' : 'process-image',
      { assetId: asset.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return asset;
  }

  /** Attaches a previously-uploaded asset to its real owner (e.g. a newly created post). */
  async attachToOwner(assetId: string, ownerId: string): Promise<void> {
    await this.mediaAssets.update({ id: assetId }, { ownerId });
  }

  /** doc PREMIUM.md: verifies an asset belongs to the given uploader and is a ready video —
   * used before letting a user point their profile's video avatar at an arbitrary asset id. */
  async getReadyVideoAssetOwnedBy(assetId: string, uploaderId: string): Promise<MediaAsset> {
    const asset = await this.mediaAssets.findOne({ where: { id: assetId } });
    if (!asset || asset.uploaderId !== uploaderId) {
      throw new NotFoundException('ASSET_NOT_FOUND');
    }
    if (asset.mediaType !== 'video' || asset.status !== 'ready') {
      throw new BadRequestException('ASSET_NOT_A_READY_VIDEO');
    }
    return asset;
  }

  /** doc 30: scheduled job removes uploads never attached to anything. */
  async cleanupOrphans(): Promise<number> {
    const cutoff = new Date(Date.now() - ORPHAN_CLEANUP_AGE_HOURS * 60 * 60 * 1000);
    const orphans = await this.mediaAssets.find({
      where: { ownerId: undefined as any, createdAt: LessThan(cutoff) },
    });
    if (orphans.length === 0) return 0;

    await this.s3.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: orphans.map((o) => ({ Key: o.storageKey })) },
      }),
    );
    await this.mediaAssets.delete(orphans.map((o) => o.id));
    return orphans.length;
  }

  /** doc 30: right-to-erasure — delete all assets for a user by key prefix + index. */
  async deleteAllForUser(userId: string): Promise<void> {
    const assets = await this.mediaAssets.find({ where: { uploaderId: userId } });
    if (assets.length === 0) return;
    await this.s3.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: assets.map((a) => ({ Key: a.storageKey })) },
      }),
    );
    await this.mediaAssets.delete(assets.map((a) => a.id));
  }

  publicUrlFor(storageKey: string): string {
    return `${this.publicBaseUrl}/${storageKey}`;
  }
}
