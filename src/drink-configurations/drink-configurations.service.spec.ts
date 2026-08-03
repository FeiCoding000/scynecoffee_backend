import { BadRequestException } from '@nestjs/common';
import {
  DrinkCategory,
  DrinkStrength,
  MilkType,
  PortionAmount,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { DrinkConfigurationsService } from './drink-configurations.service';

interface PrismaServiceMock {
  drinkConfiguration: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
  };
}

describe('DrinkConfigurationsService', () => {
  let service: DrinkConfigurationsService;
  let prismaService: PrismaServiceMock;

  const drinkConfiguration = {
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
    createdAt: new Date('2026-08-03T00:00:00.000Z'),
    updatedAt: new Date('2026-08-03T00:00:00.000Z'),
  };

  beforeEach(() => {
    prismaService = {
      drinkConfiguration: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new DrinkConfigurationsService(
      prismaService as unknown as PrismaService,
    );
  });

  it('returns all drink configurations', async () => {
    prismaService.drinkConfiguration.findMany.mockResolvedValue([
      drinkConfiguration,
    ]);

    await expect(service.findAll()).resolves.toEqual([
      {
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
      },
    ]);
    expect(prismaService.drinkConfiguration.findMany).toHaveBeenCalledWith({
      orderBy: [{ category: 'asc' }, { drinkType: 'asc' }, { milk: 'asc' }],
    });
  });

  it('reuses existing matching drink configuration', async () => {
    prismaService.drinkConfiguration.findFirst.mockResolvedValue(
      drinkConfiguration,
    );

    await expect(
      service.findOrCreate({
        category: DrinkCategory.COFFEE,
        drinkType: ' Flat White ',
        milk: MilkType.FULL,
        strength: DrinkStrength.ONE,
      }),
    ).resolves.toEqual({
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
    });
    expect(prismaService.drinkConfiguration.findFirst).toHaveBeenCalledWith({
      where: {
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
      },
    });
    expect(prismaService.drinkConfiguration.create).not.toHaveBeenCalled();
  });

  it('creates drink configuration when no matching configuration exists', async () => {
    prismaService.drinkConfiguration.findFirst.mockResolvedValue(null);
    prismaService.drinkConfiguration.create.mockResolvedValue(
      drinkConfiguration,
    );

    await service.findOrCreate({
      category: DrinkCategory.COFFEE,
      drinkType: 'Flat White',
      milk: MilkType.FULL,
      strength: DrinkStrength.ONE,
    });

    expect(prismaService.drinkConfiguration.create).toHaveBeenCalledWith({
      data: {
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
      },
    });
  });

  it('returns concurrently created drink configuration on unique constraint conflict', async () => {
    prismaService.drinkConfiguration.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(drinkConfiguration);
    prismaService.drinkConfiguration.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.findOrCreate({
        category: DrinkCategory.COFFEE,
        drinkType: 'Flat White',
      }),
    ).resolves.toEqual({
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
    });
  });

  it('throws BadRequestException when drink type is empty after trim', async () => {
    await expect(
      service.findOrCreate({
        category: DrinkCategory.COFFEE,
        drinkType: '   ',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaService.drinkConfiguration.findFirst).not.toHaveBeenCalled();
  });
});
