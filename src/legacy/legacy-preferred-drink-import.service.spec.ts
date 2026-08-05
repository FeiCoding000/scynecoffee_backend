import { ConflictException } from '@nestjs/common';
import {
  DrinkCategory,
  DrinkStrength,
  MilkType,
  PortionAmount,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { DrinkConfigurationsService } from '../drink-configurations/drink-configurations.service';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { LegacyDrinkOptionMapper } from './legacy-drink-option.mapper';
import { LegacyPreferredDrinkImportService } from './legacy-preferred-drink-import.service';

describe('LegacyPreferredDrinkImportService', () => {
  let service: LegacyPreferredDrinkImportService;
  let prismaService: {
    preferredDrink: {
      count: jest.Mock;
      create: jest.Mock;
    };
  };
  let drinkConfigurationsService: jest.Mocked<
    Pick<DrinkConfigurationsService, 'findOrCreate'>
  >;
  let mapper: jest.Mocked<Pick<LegacyDrinkOptionMapper, 'map'>>;

  const user = {
    id: 'user-1',
    displayName: 'Chloe Woodburn',
    email: null,
    googleEmail: 'user@example.com',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    isActivated: true,
  };

  beforeEach(() => {
    prismaService = {
      preferredDrink: {
        count: jest.fn(),
        create: jest.fn(),
      },
    };
    drinkConfigurationsService = {
      findOrCreate: jest.fn(),
    };
    mapper = {
      map: jest.fn(),
    };
    service = new LegacyPreferredDrinkImportService(
      prismaService as unknown as PrismaService,
      drinkConfigurationsService as unknown as DrinkConfigurationsService,
      mapper as unknown as LegacyDrinkOptionMapper,
    );
  });

  it('throws ConflictException when user already has preferred drinks', async () => {
    prismaService.preferredDrink.count.mockResolvedValue(1);

    await expect(
      service.importForUser(user, {
        legacyUserId: 'legacy-user-1',
        displayName: 'Chloe Woodburn',
        firstName: 'Chloe',
        lastName: 'Woodburn',
        normalizedName: 'chloe woodburn',
        options: [{ title: 'Flat White' }],
      }),
    ).rejects.toThrow(ConflictException);

    expect(mapper.map).not.toHaveBeenCalled();
    expect(drinkConfigurationsService.findOrCreate).not.toHaveBeenCalled();
    expect(prismaService.preferredDrink.create).not.toHaveBeenCalled();
  });

  it('maps valid options and creates preferred drinks in legacy order', async () => {
    prismaService.preferredDrink.count.mockResolvedValue(0);
    mapper.map
      .mockReturnValueOnce({
        displayName: 'Flat White',
        drinkConfiguration: {
          category: DrinkCategory.COFFEE,
          drinkType: 'Flat White',
          milk: MilkType.OAT,
          strength: DrinkStrength.TWO,
          sugar: PortionAmount.ZERO,
          sweetener: PortionAmount.ZERO,
          iced: false,
          xhot: false,
          decaf: false,
        },
      })
      .mockReturnValueOnce(null);
    drinkConfigurationsService.findOrCreate.mockResolvedValue({
      id: 'drink-configuration-1',
      category: DrinkCategory.COFFEE,
      drinkType: 'Flat White',
      milk: MilkType.OAT,
      strength: DrinkStrength.TWO,
      sugar: PortionAmount.ZERO,
      sweetener: PortionAmount.ZERO,
      teaBagCount: null,
      powderScoops: null,
      iced: false,
      xhot: false,
      decaf: false,
    });

    await expect(
      service.importForUser(user, {
        legacyUserId: 'legacy-user-1',
        displayName: 'Chloe Woodburn',
        firstName: 'Chloe',
        lastName: 'Woodburn',
        normalizedName: 'chloe woodburn',
        options: [{ title: 'Flat White' }, { reference: 'Invalid' }],
      }),
    ).resolves.toBe(1);

    expect(drinkConfigurationsService.findOrCreate).toHaveBeenCalledTimes(1);
    expect(prismaService.preferredDrink.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        drinkConfigurationId: 'drink-configuration-1',
        displayName: 'Flat White',
        sortOrder: 0,
        isDefault: true,
      },
    });
  });
});
