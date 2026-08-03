import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DrinkConfiguration,
  MilkType,
  PortionAmount,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { CreateDrinkConfigurationDto } from './dto/create-drink-configuration.dto';
import { DrinkConfigurationDto } from './drink-configurations.types';

interface NormalizedDrinkConfigurationInput {
  category: CreateDrinkConfigurationDto['category'];
  drinkType: string;
  milk: MilkType;
  strength: CreateDrinkConfigurationDto['strength'] | null;
  sugar: PortionAmount;
  sweetener: PortionAmount;
  teaBagCount: PortionAmount | null;
  powderScoops: PortionAmount | null;
  iced: boolean;
  xhot: boolean;
  decaf: boolean;
}

@Injectable()
export class DrinkConfigurationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<DrinkConfigurationDto[]> {
    const drinkConfigurations =
      await this.prismaService.drinkConfiguration.findMany({
        orderBy: [{ category: 'asc' }, { drinkType: 'asc' }, { milk: 'asc' }],
      });

    return drinkConfigurations.map((drinkConfiguration) =>
      this.toDrinkConfigurationDto(drinkConfiguration),
    );
  }

  async findOrCreate(
    createDrinkConfigurationDto: CreateDrinkConfigurationDto,
  ): Promise<DrinkConfigurationDto> {
    const input = this.normalizeInput(createDrinkConfigurationDto);

    const existingDrinkConfiguration =
      await this.prismaService.drinkConfiguration.findFirst({
        where: input,
      });

    if (existingDrinkConfiguration) {
      return this.toDrinkConfigurationDto(existingDrinkConfiguration);
    }

    try {
      const drinkConfiguration =
        await this.prismaService.drinkConfiguration.create({
          data: input,
        });

      return this.toDrinkConfigurationDto(drinkConfiguration);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const concurrentlyCreatedDrinkConfiguration =
          await this.prismaService.drinkConfiguration.findFirst({
            where: input,
          });

        if (concurrentlyCreatedDrinkConfiguration) {
          return this.toDrinkConfigurationDto(
            concurrentlyCreatedDrinkConfiguration,
          );
        }
      }

      throw error;
    }
  }

  private normalizeInput(
    createDrinkConfigurationDto: CreateDrinkConfigurationDto,
  ): NormalizedDrinkConfigurationInput {
    const drinkType = createDrinkConfigurationDto.drinkType.trim();

    if (!drinkType) {
      throw new BadRequestException('Drink type is required');
    }

    return {
      category: createDrinkConfigurationDto.category,
      drinkType,
      milk: createDrinkConfigurationDto.milk ?? MilkType.NONE,
      strength: createDrinkConfigurationDto.strength ?? null,
      sugar: createDrinkConfigurationDto.sugar ?? PortionAmount.ZERO,
      sweetener: createDrinkConfigurationDto.sweetener ?? PortionAmount.ZERO,
      teaBagCount: createDrinkConfigurationDto.teaBagCount ?? null,
      powderScoops: createDrinkConfigurationDto.powderScoops ?? null,
      iced: createDrinkConfigurationDto.iced ?? false,
      xhot: createDrinkConfigurationDto.xhot ?? false,
      decaf: createDrinkConfigurationDto.decaf ?? false,
    };
  }

  private toDrinkConfigurationDto(
    drinkConfiguration: DrinkConfiguration,
  ): DrinkConfigurationDto {
    return {
      id: drinkConfiguration.id,
      category: drinkConfiguration.category,
      drinkType: drinkConfiguration.drinkType,
      milk: drinkConfiguration.milk,
      strength: drinkConfiguration.strength,
      sugar: drinkConfiguration.sugar,
      sweetener: drinkConfiguration.sweetener,
      teaBagCount: drinkConfiguration.teaBagCount,
      powderScoops: drinkConfiguration.powderScoops,
      iced: drinkConfiguration.iced,
      xhot: drinkConfiguration.xhot,
      decaf: drinkConfiguration.decaf,
    };
  }
}
