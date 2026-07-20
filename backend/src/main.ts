import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * doc 18 NFR-SCALE-3: Redis pub/sub backplane so WebSocket gateway pods
 * scale horizontally — a message published on one node's socket connection
 * is broadcast through Redis so recipients connected to other nodes still
 * receive it.
 */
class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;

  constructor(
    app: any,
    private readonly redisHost: string,
    private readonly redisPort: number,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: `redis://${this.redisHost}:${this.redisPort}` });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}

async function bootstrap() {
  // doc PAYMENTS.md: Stripe webhook signature verification needs the exact
  // raw request bytes, not the JSON-parsed body — NestJS's built-in
  // rawBody option (populates req.rawBody) is the supported way to get
  // both a parsed body for every other route and raw bytes for this one.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  // doc 31: reject malformed/oversized input before it reaches business
  // logic; strips unknown properties rather than trusting client payload shape.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const redisAdapter = new RedisIoAdapter(
    app,
    config.get<string>('REDIS_HOST') ?? 'localhost',
    Number(config.get<string>('REDIS_PORT') ?? 6379),
  );
  await redisAdapter.connectToRedis();
  app.useWebSocketAdapter(redisAdapter);

  // doc 31/SECURITY.md: CORS restricted to configured origins in production;
  // permissive only in local development where CORS_ORIGIN is unset.
  const corsOrigin = config.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',') : true,
    credentials: true,
  });

  // doc 22/Stage 5: OpenAPI/Swagger — generated from the same decorators
  // (@ApiTags/@ApiOperation/@ApiResponse) controllers already carry, so the
  // doc can't silently drift from the real contract the way a hand-written
  // duplicate would (doc 22's CI-enforced-tolerance principle, applied here
  // at the source instead of as a separate diffing step).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Lumo API')
    .setDescription('edina.ua — public REST + GraphQL API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = Number(config.get<string>('PORT') ?? 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Lumo backend listening on :${port}`);
  // eslint-disable-next-line no-console
  console.log(`OpenAPI docs at :${port}/api/docs`);
}

bootstrap();
