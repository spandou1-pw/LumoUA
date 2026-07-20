import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityMember } from '../../communities/entities/community-member.entity';

export interface CommunityGrowthPoint {
  date: string;
  newMembers: number;
  cumulativeMembers: number;
}

@Injectable()
export class CommunityGrowthService {
  constructor(@InjectRepository(CommunityMember) private readonly members: Repository<CommunityMember>) {}

  async growthOverTime(communityId: string, sinceDays = 90): Promise<CommunityGrowthPoint[]> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

    const rows = await this.members
      .createQueryBuilder('m')
      .select("to_char(m.joined_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'newMembers')
      .where('m.community_id = :communityId', { communityId })
      .andWhere('m.joined_at > :since', { since })
      .groupBy("to_char(m.joined_at, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; newMembers: string }>();

    const priorCount = await this.members
      .createQueryBuilder('m')
      .where('m.community_id = :communityId', { communityId })
      .andWhere('m.joined_at <= :since', { since })
      .getCount();

    let cumulative = priorCount;
    return rows.map((r) => {
      cumulative += Number(r.newMembers);
      return { date: r.date, newMembers: Number(r.newMembers), cumulativeMembers: cumulative };
    });
  }
}
