import { UserRole, UserStatus } from '@prisma/client';
import { DrinkConfigurationDto } from '../drink-configurations/drink-configurations.types';

export interface UserDto {
  id: string;
  displayName: string;
  email: string | null;
  googleEmail: string | null;
  role: UserRole;
  status: UserStatus;
  isActivated: boolean;
  isProfileSetupCompleted: boolean;
}

export interface ActivateUserResult {
  status: 'activated';
  user: UserDto;
}

export interface PreferredDrinkDto {
  id: string;
  displayName: string;
  drinkConfigurationId: string;
  sortOrder: number | null;
  isDefault: boolean;
  drinkConfiguration: DrinkConfigurationDto;
}
