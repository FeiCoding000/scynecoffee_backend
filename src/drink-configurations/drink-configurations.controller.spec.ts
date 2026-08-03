import { Test, TestingModule } from '@nestjs/testing';
import {
  DrinkCategory,
  DrinkStrength,
  MilkType,
  PortionAmount,
} from '@prisma/client';
import { DrinkConfigurationsController } from './drink-configurations.controller';
import { DrinkConfigurationsService } from './drink-configurations.service';
import { CreateDrinkConfigurationDto } from './dto/create-drink-configuration.dto';
import { DrinkConfigurationDto } from './drink-configurations.types';

describe('DrinkConfigurationsController', () => {
  let controller: DrinkConfigurationsController;
  let drinkConfigurationsService: jest.Mocked<
    Pick<DrinkConfigurationsService, 'findAll' | 'findOrCreate'>
  >;

  const drinkConfiguration: DrinkConfigurationDto = {
    id: 'drink-configuration-1',
    category: DrinkCategory.COFFEE,
    drinkType: 'Flat White',
    milk: MilkType.FULL,
    strength: DrinkStrength.ONE,
    sugar: PortionAmount.ZERO,
    sweetener: PortionAmount.ZERO,
    teaBagCount: null,
    powderScoops: null,
    iced: false,
    xhot: false,
    decaf: false,
  };

  beforeEach(async () => {
    drinkConfigurationsService = {
      findAll: jest.fn(),
      findOrCreate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DrinkConfigurationsController],
      providers: [
        {
          provide: DrinkConfigurationsService,
          useValue: drinkConfigurationsService,
        },
      ],
    }).compile();

    controller = module.get<DrinkConfigurationsController>(
      DrinkConfigurationsController,
    );
  });

  it('returns drink configurations in response envelope', async () => {
    drinkConfigurationsService.findAll.mockResolvedValue([drinkConfiguration]);

    await expect(controller.findAll()).resolves.toEqual({
      data: [drinkConfiguration],
    });
  });

  it('returns created or reused drink configuration in response envelope', async () => {
    const createDto: CreateDrinkConfigurationDto = {
      category: DrinkCategory.COFFEE,
      drinkType: 'Flat White',
      milk: MilkType.FULL,
      strength: DrinkStrength.ONE,
    };

    drinkConfigurationsService.findOrCreate.mockResolvedValue(
      drinkConfiguration,
    );

    await expect(controller.create(createDto)).resolves.toEqual({
      data: drinkConfiguration,
    });
    expect(drinkConfigurationsService.findOrCreate).toHaveBeenCalledWith(
      createDto,
    );
  });
});
