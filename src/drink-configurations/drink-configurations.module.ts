import { Module } from '@nestjs/common';
import { DrinkConfigurationsController } from './drink-configurations.controller';
import { DrinkConfigurationsService } from './drink-configurations.service';

@Module({
  controllers: [DrinkConfigurationsController],
  providers: [DrinkConfigurationsService],
})
export class DrinkConfigurationsModule {}
