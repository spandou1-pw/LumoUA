import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { FounderProgramMember } from './entities/founder-program-member.entity';
import { FounderProgramService } from './founder-program.service';
import { FounderProgramController } from './founder-program.controller';
import { ProfileCustomizationModule } from '../../profile-customization/profile-customization.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, FounderProgramMember]), ProfileCustomizationModule],
  controllers: [FounderProgramController],
  providers: [FounderProgramService],
  exports: [FounderProgramService],
})
export class FounderProgramModule {}
