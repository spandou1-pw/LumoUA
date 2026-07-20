import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { GiftCatalogItem } from '../../src/modules/gifts/entities/gift-catalog-item.entity';
import { WalletService } from '../../src/modules/wallet/wallet.service';

/**
 * doc 38 + doc PAYMENTS.md: exercises the real money-adjacent path end to
 * end — wallet crediting (via a direct WalletService call standing in for
 * a completed purchase, since real Stripe/Apple/Google credentials aren't
 * available in CI) through to a gift send debiting the sender and the
 * insufficient-balance rejection actually returning the right HTTP status.
 */
describe('Wallet & Gifts API (integration)', () => {
  let app: INestApplication;
  let senderToken: string;
  let recipientToken: string;
  let recipientId: string;
  let senderId: string;
  let giftItemId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const sender = await registerAndLogin(app, 'gift-sender@edina.test');
    const recipient = await registerAndLogin(app, 'gift-recipient@edina.test');
    senderToken = sender.token;
    senderId = sender.userId;
    recipientToken = recipient.token;
    recipientId = recipient.userId;

    // Seed a gift catalog item directly — catalog management is an admin
    // concern out of scope for this test, we just need one to exist.
    const giftRepo = app.get(getRepositoryToken(GiftCatalogItem));
    const item = await giftRepo.save(giftRepo.create({ name: 'Троянда', coinCost: '100', iconUrl: 'rose.png' }));
    giftItemId = item.id;

    // Credit the sender directly via WalletService — standing in for a
    // completed real-money purchase, which PurchaseVerificationService
    // would normally trigger (doc: real Stripe/Apple/Google flows are
    // covered by provider-level tests once sandbox credentials exist).
    const wallet = app.get(WalletService);
    await wallet.credit({ userId: senderId, amount: 250n, type: 'coin_purchase' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /wallet/balance reflects the credited amount', async () => {
    const res = await request(app.getHttpServer())
      .get('/wallet/balance')
      .set('Authorization', `Bearer ${senderToken}`)
      .expect(200);

    expect(res.body.coinBalance).toBe('250');
  });

  it('POST /gifts/send debits exactly the gift cost from the sender', async () => {
    await request(app.getHttpServer())
      .post('/gifts/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientId, giftCatalogItemId: giftItemId, message: 'Дякую!' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/wallet/balance')
      .set('Authorization', `Bearer ${senderToken}`)
      .expect(200);

    expect(res.body.coinBalance).toBe('150'); // 250 - 100
  });

  it("does NOT credit the recipient's spendable balance (doc PAYMENTS.md non-redeemable boundary)", async () => {
    const res = await request(app.getHttpServer())
      .get('/wallet/balance')
      .set('Authorization', `Bearer ${recipientToken}`)
      .expect(200);

    expect(res.body.coinBalance).toBe('0');
  });

  it('rejects sending a gift the sender cannot afford, and does not partially debit', async () => {
    // Sender has 150 left; send two more 100-cost gifts — the second must fail.
    await request(app.getHttpServer())
      .post('/gifts/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientId, giftCatalogItemId: giftItemId })
      .expect(201);

    await request(app.getHttpServer())
      .post('/gifts/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientId, giftCatalogItemId: giftItemId })
      .expect(400);

    const res = await request(app.getHttpServer())
      .get('/wallet/balance')
      .set('Authorization', `Bearer ${senderToken}`)
      .expect(200);

    expect(res.body.coinBalance).toBe('50'); // 150 - 100 from the successful send; failed one untouched
  });

  it('GET /wallet/transactions returns the full audit trail in reverse-chronological order', async () => {
    const res = await request(app.getHttpServer())
      .get('/wallet/transactions')
      .set('Authorization', `Bearer ${senderToken}`)
      .expect(200);

    expect(res.body.items.length).toBeGreaterThanOrEqual(3); // credit + 2 successful gift debits
    expect(res.body.items[0].type).toBe('gift_sent'); // most recent first
  });
});

async function registerAndLogin(app: INestApplication, email: string): Promise<{ token: string; userId: string }> {
  const registerRes = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'correct horse battery staple' })
    .expect(201);

  const loginRes = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: 'correct horse battery staple', deviceId: `integration-${email}` })
    .expect(200);

  return { token: loginRes.body.accessToken, userId: registerRes.body.userId };
}
