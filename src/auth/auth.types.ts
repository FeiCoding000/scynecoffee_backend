import { UserRole, UserStatus } from '@prisma/client';

export interface FirebaseUserContext {
  uid: string;
  googleEmail: string | null;
  name?: string;
}

export interface AuthenticatedUserDto {
  id: string;
  displayName: string;
  email: string | null;
  googleEmail: string | null;
  role: UserRole;
  status: UserStatus;
  isActivated: boolean;
  isProfileSetupCompleted: boolean;
}

export interface AuthVerifyResult {
  user: AuthenticatedUserDto | null;
  firebaseUser: FirebaseUserContext;
  isActivated: boolean;
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUserDto;
  firebaseUser?: FirebaseUserContext;
}
