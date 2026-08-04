import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DrinkConfigurationsModule } from '../drink-configurations/drink-configurations.module';
import { LegacyModule } from '../legacy/legacy.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule, DrinkConfigurationsModule, LegacyModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
