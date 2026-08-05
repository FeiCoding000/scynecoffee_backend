import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ActivationCodesController } from './activation-codes.controller';
import { ActivationCodesService } from './activation-codes.service';

@Module({
  imports: [AuthModule],
  controllers: [ActivationCodesController],
  providers: [ActivationCodesService],
})
export class ActivationCodesModule {}
