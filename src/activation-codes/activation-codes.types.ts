import { ActivationCodeStatus, UserRole } from '@prisma/client';

export interface ActivationCodeDto {
  id: string;
  code: string;
  role: UserRole;
  status: ActivationCodeStatus;
  createdAt: string;
}

export interface GenerateActivationCodesResult {
  activationCodes: ActivationCodeDto[];
}
