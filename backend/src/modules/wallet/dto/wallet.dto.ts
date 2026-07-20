import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class TransferCoinsDto {
  @ApiProperty()
  @IsUUID()
  recipientId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  message?: string;
}

export class LockWalletDto {
  @ApiProperty()
  @IsString()
  reason: string;
}
