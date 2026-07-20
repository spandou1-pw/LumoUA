import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * doc 38 "Integration Tests": real Postgres/Redis (via docker-compose or CI
 * service containers, doc 36), not mocked at the database layer — this is
 * exactly the kind of test that would catch an authorization bug a
 * mocked-repository unit test could miss (e.g. the "author only" check in
 * posts.service.spec.ts is re-verified here end-to-end through real HTTP +
 * real DB rows, per doc 24's own reasoning for why integration tests matter
 * for authorization specifically).
 *
 * Run with the local stack up: `docker compose up -d && npm run test:integration`
 * (add a `test:integration` script pointing Jest at this file/pattern once
 * the test runner config is finalized — omitted here to avoid prescribing
 * a config choice belongs to doc 36's CI setup).
 */
describe('Posts API (integration)', () => {
  let app: INestApplication;
  let userAToken: string;
  let userBToken: string;
  let createdPostId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Register + verify two distinct users so ownership checks (doc 24)
    // are exercised across a real user boundary, not a single test user.
    userAToken = await registerAndLogin(app, 'user-a@edina.test');
    userBToken = await registerAndLogin(app, 'user-b@edina.test');
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /posts creates a post and returns assembled engagement state', async () => {
    const res = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ body: 'Перший пост інтеграційного тесту' })
      .expect(201);

    expect(res.body.body).toBe('Перший пост інтеграційного тесту');
    expect(res.body.likeCount).toBe(0);
    expect(res.body.viewerHasLiked).toBe(false);
    createdPostId = res.body.id;
  });

  it('POST /posts/:id/like increments likeCount and sets viewerHasLiked for the liker', async () => {
    await request(app.getHttpServer())
      .post(`/posts/${createdPostId}/like`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(200);

    expect(res.body.likeCount).toBe(1);
    expect(res.body.viewerHasLiked).toBe(true);
  });

  it('PATCH /posts/:id returns 403 when a non-author attempts to edit (doc 24)', async () => {
    await request(app.getHttpServer())
      .patch(`/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ body: 'hacked' })
      .expect(403);
  });

  it('PATCH /posts/:id succeeds for the author', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ body: 'відредаговано' })
      .expect(200);

    expect(res.body.body).toBe('відредаговано');
  });

  it('DELETE /posts/:id soft-deletes — subsequent GET returns 404', async () => {
    await request(app.getHttpServer())
      .delete(`/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(404);
  });

  it('GET /posts/:id without a token is rejected (doc 23 default-authenticated routes)', async () => {
    await request(app.getHttpServer()).get(`/posts/${createdPostId}`).expect(401);
  });
});

/**
 * doc 08 flow 1 abbreviated for test setup: register -> verify (code read
 * back via the test-only return value in AuthService.issueVerificationCode,
 * see doc 25 comment in auth.service.ts) -> login -> return access token.
 */
async function registerAndLogin(app: INestApplication, email: string): Promise<string> {
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'correct horse battery staple' })
    .expect(201);

  // NOTE: in a real CI run, the verification code would be intercepted from
  // a test email sink (e.g. Mailhog) rather than assumed — this integration
  // test focuses on the Posts API surface, so email verification is treated
  // as an out-of-band precondition here rather than re-tested end-to-end
  // (that flow has its own dedicated auth.integration-spec.ts).
  const loginRes = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: 'correct horse battery staple', deviceId: 'integration-test-device' })
    .expect(200);

  return loginRes.body.accessToken;
}
