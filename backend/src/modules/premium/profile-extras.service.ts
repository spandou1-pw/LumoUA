import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileExtras } from './entities/user-profile-extras.entity';
import { PremiumService } from './premium.service';
import { FilesService } from '../files/files.service';

export interface UpdateProfileExtrasInput {
  statusText?: string | null;
  statusEmoji?: string | null;
  animatedProfileEnabled?: boolean;
  videoAvatarAssetId?: string | null;
}

@Injectable()
export class ProfileExtrasService {
  constructor(
    @InjectRepository(UserProfileExtras) private readonly extras: Repository<UserProfileExtras>,
    private readonly premium: PremiumService,
    private readonly filesService: FilesService,
  ) {}

  async getForUser(userId: string): Promise<UserProfileExtras> {
    const existing = await this.extras.findOne({ where: { userId } });
    if (existing) return existing;
    return this.extras.create({ userId, statusText: null, statusEmoji: null, animatedProfileEnabled: false, videoAvatarAssetId: null });
  }

  /** doc: "Status beside username" / "Animated Profile" / "Video Avatar" — all premium-exclusive, one update path. */
  async update(userId: string, input: UpdateProfileExtrasInput): Promise<UserProfileExtras> {
    if (!(await this.premium.isPremium(userId))) {
      throw new ForbiddenException('PREMIUM_SUBSCRIPTION_REQUIRED');
    }

    if (input.videoAvatarAssetId) {
      // doc 30: video avatar reuses the existing media pipeline (owner_type='avatar',
      // media_type='video') — verifies the asset actually belongs to this user and
      // is a ready video before pointing the profile at it (not just a blind attach).
      const asset = await this.filesService.getReadyVideoAssetOwnedBy(input.videoAvatarAssetId, userId);
      await this.filesService.attachToOwner(asset.id, userId);
    }

    let extras = await this.extras.findOne({ where: { userId } });
    if (!extras) {
      extras = this.extras.create({ userId });
    }
    Object.assign(extras, input);
    return this.extras.save(extras);
  }

  /** Non-premium users always get a valid (empty) extras object, never an error — reading is free, writing is gated. */
  async getPublicDisplay(userId: string): Promise<{ statusText: string | null; statusEmoji: string | null; animatedProfileEnabled: boolean; videoAvatarAssetId: string | null }> {
    const extras = await this.getForUser(userId);
    return {
      statusText: extras.statusText,
      statusEmoji: extras.statusEmoji,
      animatedProfileEnabled: extras.animatedProfileEnabled,
      videoAvatarAssetId: extras.videoAvatarAssetId,
    };
  }
}
