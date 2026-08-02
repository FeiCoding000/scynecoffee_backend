import { UserRole, UserStatus } from '@prisma/client';

export interface UserDto {
  id: string;
  displayName: string;
  email: string | null;
  googleEmail: string | null;
  role: UserRole;
  status: UserStatus;
  isActivated: boolean;
}

export interface ActivateUserResult {
  status: 'activated';
  user: UserDto;
  preferredDrinkCount: 0;
}
