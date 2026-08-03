import {
  DrinkCategory,
  DrinkStrength,
  MilkType,
  PortionAmount,
} from '@prisma/client';

export interface DrinkConfigurationDto {
  id: string;
  category: DrinkCategory;
  drinkType: string;
  milk: MilkType;
  strength: DrinkStrength | null;
  sugar: PortionAmount;
  sweetener: PortionAmount;
  teaBagCount: PortionAmount | null;
  powderScoops: PortionAmount | null;
  iced: boolean;
  xhot: boolean;
  decaf: boolean;
}
