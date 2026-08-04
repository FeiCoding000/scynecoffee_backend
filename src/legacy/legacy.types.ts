import {
  DrinkCategory,
  DrinkStrength,
  MilkType,
  PortionAmount,
} from '@prisma/client';
import { UserDto } from '../users/users.types';

export interface LegacyDrinkOption {
  category?: string;
  title?: string;
  reference?: string;
  milk?: string;
  strength?: number;
  sugar?: number;
  sweetner?: number;
  teaBags?: number;
  isIced?: boolean;
  isXHot?: boolean;
  isDecaf?: boolean;
}

export interface LegacyUser {
  legacyUserId: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  normalizedName: string | null;
  options: LegacyDrinkOption[];
}

export interface LegacyUserCandidateDto {
  legacyUserId: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  preferredDrinkCount: number;
}

export interface SearchLegacyUsersResult {
  legacyUsers: LegacyUserCandidateDto[];
}

export interface LegacyProfileImportResult {
  status: 'legacy_profile_imported';
  user: UserDto;
  importedPreferredDrinkCount: number;
}

export interface MappedLegacyDrinkOption {
  displayName: string;
  drinkConfiguration: {
    category: DrinkCategory;
    drinkType: string;
    milk?: MilkType;
    strength?: DrinkStrength;
    sugar?: PortionAmount;
    sweetener?: PortionAmount;
    teaBagCount?: PortionAmount;
    iced?: boolean;
    xhot?: boolean;
    decaf?: boolean;
  };
}
