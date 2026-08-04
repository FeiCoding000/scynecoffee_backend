import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UserDto } from '../users/users.types';
import { LegacyPreferredDrinkImportService } from './legacy-preferred-drink-import.service';
import { LegacyUsersRepository } from './legacy-users.repository';
import { LegacyProfileImportResult } from './legacy.types';

@Injectable()
export class LegacyProfileImportService {
  constructor(
    private readonly authService: AuthService,
    private readonly legacyUsersRepository: LegacyUsersRepository,
    private readonly legacyPreferredDrinkImportService: LegacyPreferredDrinkImportService,
  ) {}

  async importSelectedLegacyProfile(
    authorizationHeader: string | undefined,
    legacyUserId: string,
  ): Promise<LegacyProfileImportResult> {
    const user = await this.getCurrentActivatedUser(authorizationHeader);
    const trimmedLegacyUserId = legacyUserId.trim();

    if (!trimmedLegacyUserId) {
      throw new BadRequestException('Legacy user id is required');
    }

    const legacyUser =
      await this.legacyUsersRepository.findById(trimmedLegacyUserId);

    if (!legacyUser) {
      throw new NotFoundException('Legacy user not found');
    }

    const importedPreferredDrinkCount =
      await this.legacyPreferredDrinkImportService.importForUser(
        user,
        legacyUser,
      );

    return {
      status: 'legacy_profile_imported',
      user,
      importedPreferredDrinkCount,
    };
  }

  private async getCurrentActivatedUser(
    authorizationHeader: string | undefined,
  ): Promise<UserDto> {
    const { user } =
      await this.authService.verifyAuthorizationHeader(authorizationHeader);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActivated) {
      throw new ForbiddenException('User is not activated');
    }

    return user;
  }
}
