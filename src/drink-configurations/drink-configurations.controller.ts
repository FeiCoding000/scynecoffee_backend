import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DrinkConfigurationsService } from './drink-configurations.service';
import { CreateDrinkConfigurationDto } from './dto/create-drink-configuration.dto';
import { DrinkConfigurationDto } from './drink-configurations.types';

interface DrinkConfigurationResponse {
  data: DrinkConfigurationDto;
}

interface DrinkConfigurationListResponse {
  data: DrinkConfigurationDto[];
}

@ApiTags('drink-configurations')
@Controller('drink-configurations')
export class DrinkConfigurationsController {
  constructor(
    private readonly drinkConfigurationsService: DrinkConfigurationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get drink configurations' })
  @ApiOkResponse({ description: 'Drink configurations' })
  async findAll(): Promise<DrinkConfigurationListResponse> {
    const drinkConfigurations = await this.drinkConfigurationsService.findAll();

    return { data: drinkConfigurations };
  }

  @Post()
  @ApiOperation({ summary: 'Create or reuse a drink configuration' })
  @ApiCreatedResponse({ description: 'Drink configuration created or reused' })
  async create(
    @Body() createDrinkConfigurationDto: CreateDrinkConfigurationDto,
  ): Promise<DrinkConfigurationResponse> {
    const drinkConfiguration =
      await this.drinkConfigurationsService.findOrCreate(
        createDrinkConfigurationDto,
      );

    return { data: drinkConfiguration };
  }
}
