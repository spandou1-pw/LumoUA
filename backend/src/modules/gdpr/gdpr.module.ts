import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Follow } from '../users/entities/follow.entity';
import { WalletTransaction } from '../wallet/entities/wallet-transaction.entity';
import { GiftTransaction } from '../gifts/entities/gift-transaction.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';
import { DataExportService } from './data-export.service';
import { DataDeletionService } from './data-deletion.service';
import { DataDeletionProcessor } from './data-deletion.processor';
import { GdprController } from './gdpr.controller';
import { FilesModule } from '../files/files.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post, Comment, Follow, WalletTransaction, GiftTransaction, DataDeletionRequest]),
    BullModule.registerQueue({ name: 'gdpr-deletion' }),
    FilesModule,
    AuthModule,
  ],
  controllers: [GdprController],
  providers: [DataExportService, DataDeletionService, DataDeletionProcessor],
  exports: [DataDeletionService],
})
export class GdprModule {}
