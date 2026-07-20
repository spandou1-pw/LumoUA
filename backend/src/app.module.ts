import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { typeOrmConfig } from './config/typeorm.config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingRedactionInterceptor } from './common/interceptors/logging-redaction.interceptor';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { FilesModule } from './modules/files/files.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagesModule } from './modules/messages/messages.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { FeedModule } from './modules/feed/feed.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { GiftsModule } from './modules/gifts/gifts.module';
import { PremiumModule } from './modules/premium/premium.module';
import { ProfileCustomizationModule } from './modules/profile-customization/profile-customization.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { ConfigurationModule } from './modules/configuration/configuration.module';
import { AdminModule } from './modules/admin/admin.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { ContentModerationModule } from './modules/ai-platform/content-moderation/content-moderation.module';
import { SafetyFiltersModule } from './modules/ai-platform/safety-filters/safety-filters.module';
import { SpamDetectionModule } from './modules/ai-platform/spam-detection/spam-detection.module';
import { FakeAccountDetectionModule } from './modules/ai-platform/fake-account-detection/fake-account-detection.module';
import { RecommendationsModule } from './modules/ai-platform/recommendations/recommendations.module';
import { TranslationModule } from './modules/ai-platform/translation/translation.module';
import { GdprModule } from './modules/gdpr/gdpr.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { BotDetectionModule } from './modules/bot-detection/bot-detection.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { MetricsInterceptor } from './modules/monitoring/metrics.interceptor';
import { SecurityAuditModule } from './modules/security-audit/security-audit.module';
import { ReferralsModule } from './modules/growth/referrals/referrals.module';
import { FounderProgramModule } from './modules/growth/founder/founder-program.module';
import { MissionsModule } from './modules/growth/missions/missions.module';
import { AbTestingModule } from './modules/growth/ab-testing/ab-testing.module';
import { RetentionModule } from './modules/analytics/retention/retention.module';
import { FunnelsModule } from './modules/analytics/funnels/funnels.module';
import { CreatorDashboardModule } from './modules/analytics/creator-dashboard/creator-dashboard.module';
import { CrashPerformanceModule } from './modules/analytics/crash-performance/crash-performance.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    EventEmitterModule.forRoot(), // doc 25: domain-event pipeline backbone

    // doc 31 NFR-SEC-3: default tier for any endpoint not using a named
    // RateLimit* decorator (common/decorators/rate-limit.decorator.ts).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),

    // doc 27: short-TTL cache for feed pages, reused by search (doc 29).
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: config.get<string>('REDIS_HOST') ?? 'localhost',
            port: Number(config.get<string>('REDIS_PORT') ?? 6379),
          },
        }),
        ttl: 30_000, // doc 27: ~30-60s default; overridden per-endpoint where needed
      }),
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST') ?? 'localhost',
          port: Number(config.get<string>('REDIS_PORT') ?? 6379),
        },
      }),
    }),

    // doc 22: GraphQL specifically for feed/search aggregation (read paths
    // that benefit from client-shaped queries across related entities) —
    // REST remains the primary transport everywhere else (doc 18 rationale).
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
    }),

    // Feature modules (doc 18 module boundaries — each owns its domain,
    // cross-module access goes through exported providers only, doc 39).
    AuthModule,
    UsersModule,
    RolesModule,
    FilesModule,
    NotificationsModule,
    MessagesModule,
    CommunitiesModule,
    PostsModule,
    CommentsModule,
    ReactionsModule,
    FeedModule,
    WalletModule,
    PaymentsModule,
    SubscriptionsModule,
    GiftsModule,
    PremiumModule,
    ProfileCustomizationModule,
    ModerationModule,
    FeatureFlagsModule,
    ConfigurationModule,
    AdminModule,
    AdminDashboardModule,
    SafetyFiltersModule,
    ContentModerationModule,
    SpamDetectionModule,
    FakeAccountDetectionModule,
    RecommendationsModule,
    TranslationModule,
    GdprModule,
    SessionsModule,
    BotDetectionModule,
    MonitoringModule,
    SecurityAuditModule,
    ReferralsModule,
    FounderProgramModule,
    MissionsModule,
    AbTestingModule,
    RetentionModule,
    FunnelsModule,
    CreatorDashboardModule,
    CrashPerformanceModule,
    CampaignsModule,
  ],
  controllers: [HealthController],
  providers: [
    // doc 31 NFR-SEC-3: rate limiting runs first — reject abusive traffic
    // before it reaches auth/business logic.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // doc 23: every route requires auth by default; opt out with @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // doc 24: @Roles() enforcement runs after auth.
    { provide: APP_GUARD, useClass: RolesGuard },
    // doc 22: standard error envelope on every unhandled/handled exception.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // doc 31/37: structured logging with field redaction on every request.
    { provide: APP_INTERCEPTOR, useClass: LoggingRedactionInterceptor },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule {}
