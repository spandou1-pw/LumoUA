import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({ description: 'CoinPack.id or PremiumPlan.id' })
  @IsUUID()
  productId: string;

  @ApiProperty({ enum: ['coins', 'subscription'] })
  @IsIn(['coins', 'subscription'])
  productType: 'coins' | 'subscription';
}

export class VerifyApplePurchaseDto {
  @ApiProperty({ description: 'StoreKit 2 signed transaction (JWS)' })
  @IsString()
  signedTransaction: string;

  @ApiProperty({ description: 'CoinPack.id or PremiumPlan.id this purchase is expected to fulfil' })
  @IsUUID()
  productId: string;

  @ApiProperty({ enum: ['coins', 'subscription'] })
  @IsIn(['coins', 'subscription'])
  productType: 'coins' | 'subscription';
}

export class VerifyGooglePurchaseDto {
  @ApiProperty()
  @IsString()
  purchaseToken: string;

  @ApiProperty()
  @IsString()
  googleProductId: string;

  @ApiProperty({ description: 'CoinPack.id or PremiumPlan.id this purchase is expected to fulfil' })
  @IsUUID()
  productId: string;

  @ApiProperty({ enum: ['coins', 'subscription'] })
  @IsIn(['coins', 'subscription'])
  productType: 'coins' | 'subscription';
}
