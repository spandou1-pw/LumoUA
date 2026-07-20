import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '../../users/entities/follow.entity';
import { Block } from '../../users/entities/block.entity';

export interface FriendSuggestion {
  userId: string;
  mutualCount: number;
  mutualUserIds: string[];
}

/**
 * doc AI.md "Friend Recommendations": mutual-connection counting is a
 * real, well-understood graph algorithm — not a stub, not an ML model.
 * "People you may know, ranked by mutual follows" is genuinely what most
 * social platforms' friend recommendations actually are at this scale;
 * reaching for ML here before there's behavioral data to train on would
 * be premature complexity doc 28 itself warns against.
 */
@Injectable()
export class FriendRecommendationsService {
  constructor(
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(Block) private readonly blocks: Repository<Block>,
  ) {}

  /**
   * Algorithm: find everyone the user's follows also follow (2nd-degree
   * network), count how many of the user's 1st-degree follows each
   * candidate is connected to, exclude people already followed/blocked
   * and the user themselves, rank by mutual count descending.
   */
  async suggest(userId: string, limit = 20): Promise<FriendSuggestion[]> {
    const myFollows = await this.follows.find({ where: { followerId: userId } });
    const myFollowingIds = myFollows.map((f) => f.followeeId);
    if (myFollowingIds.length === 0) return [];

    const blockedRows = await this.blocks.find({ where: [{ blockerId: userId }, { blockedId: userId }] });
    const blockedIds = new Set(blockedRows.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)));
    const alreadyFollowing = new Set(myFollowingIds);

    // Everyone my follows also follow (candidates), with which of my
    // follows connects to each candidate.
    const secondDegree = await this.follows
      .createQueryBuilder('f')
      .select('f.followee_id', 'candidateId')
      .addSelect('f.follower_id', 'viaUserId')
      .where('f.follower_id IN (:...ids)', { ids: myFollowingIds })
      .getRawMany<{ candidateId: string; viaUserId: string }>();

    const candidateMap = new Map<string, Set<string>>(); // candidateId -> set of "via" user ids (mutual connections)
    for (const row of secondDegree) {
      if (row.candidateId === userId) continue;
      if (alreadyFollowing.has(row.candidateId)) continue;
      if (blockedIds.has(row.candidateId)) continue;

      const via = candidateMap.get(row.candidateId) ?? new Set<string>();
      via.add(row.viaUserId);
      candidateMap.set(row.candidateId, via);
    }

    const suggestions: FriendSuggestion[] = Array.from(candidateMap.entries())
      .map(([candidateId, viaSet]) => ({
        userId: candidateId,
        mutualCount: viaSet.size,
        mutualUserIds: Array.from(viaSet),
      }))
      .sort((a, b) => b.mutualCount - a.mutualCount)
      .slice(0, limit);

    return suggestions;
  }
}
