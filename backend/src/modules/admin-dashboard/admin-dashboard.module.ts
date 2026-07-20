import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PaymentsModule } from '../payments/payments.module';
import { WalletModule } from '../wallet/wallet.module';
import { GiftsModule } from '../gifts/gifts.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Post]), PaymentsModule, WalletModule, GiftsModule, ModerationModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class AdminDashboardModule {}
