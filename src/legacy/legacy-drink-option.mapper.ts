import { Injectable } from '@nestjs/common';
import {
  DrinkCategory,
  DrinkStrength,
  MilkType,
  PortionAmount,
} from '@prisma/client';
import { LegacyDrinkOption, MappedLegacyDrinkOption } from './legacy.types';

@Injectable()
export class LegacyDrinkOptionMapper {
  map(option: LegacyDrinkOption): MappedLegacyDrinkOption | null {
    const drinkType = option.title?.trim();

    if (!drinkType) {
      return null;
    }

    const category = this.mapCategory(option.category);
    const displayName = option.reference?.trim() || drinkType;
    const teaBagCount =
      category === DrinkCategory.TEA
        ? this.mapPortionAmount(option.teaBags)
        : undefined;

    return {
      displayName,
      drinkConfiguration: {
        category,
        drinkType,
        milk: this.mapMilk(option.milk),
        strength: this.mapStrength(option.strength),
        sugar: this.mapPortionAmount(option.sugar),
        sweetener: this.mapPortionAmount(option.sweetner),
        teaBagCount,
        iced: option.isIced ?? false,
        xhot: option.isXHot ?? false,
        decaf: option.isDecaf ?? false,
      },
    };
  }

  private mapCategory(category: string | undefined): DrinkCategory {
    switch (category?.trim().toLowerCase()) {
      case 'coffee':
        return DrinkCategory.COFFEE;
      case 'tea':
        return DrinkCategory.TEA;
      case 'chai':
        return DrinkCategory.CHAI;
      case 'chocolate':
      case 'hot chocolate':
        return DrinkCategory.CHOCOLATE;
      case 'milk':
        return DrinkCategory.MILK;
      default:
        return DrinkCategory.OTHER;
    }
  }

  private mapMilk(milk: string | undefined): MilkType {
    switch (milk?.trim().toLowerCase()) {
      case 'full':
      case 'full cream':
      case 'regular':
        return MilkType.FULL;
      case 'lite':
      case 'light':
      case 'skim':
        return MilkType.LITE;
      case 'almond':
        return MilkType.ALMOND;
      case 'soy':
        return MilkType.SOY;
      case 'lactose free':
      case 'lactose_free':
      case 'lactose-free':
        return MilkType.LACTOSE_FREE;
      case 'oat':
        return MilkType.OAT;
      case 'none':
      case 'black':
      case '':
      case undefined:
        return MilkType.NONE;
      default:
        return MilkType.NONE;
    }
  }

  private mapStrength(strength: number | undefined): DrinkStrength | undefined {
    switch (strength) {
      case 0.5:
        return DrinkStrength.HALF;
      case 1:
        return DrinkStrength.ONE;
      case 2:
        return DrinkStrength.TWO;
      case 3:
        return DrinkStrength.THREE;
      case 4:
        return DrinkStrength.FOUR;
      default:
        return undefined;
    }
  }

  private mapPortionAmount(amount: number | undefined): PortionAmount {
    switch (amount) {
      case 0.5:
        return PortionAmount.HALF;
      case 1:
        return PortionAmount.ONE;
      case 2:
        return PortionAmount.TWO;
      case 3:
        return PortionAmount.THREE;
      case 4:
        return PortionAmount.FOUR;
      case 5:
        return PortionAmount.FIVE;
      case 0:
      default:
        return PortionAmount.ZERO;
    }
  }
}
