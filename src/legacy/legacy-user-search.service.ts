import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { LegacyUserCandidateMapper } from './legacy-user-candidate.mapper';
import { LegacyUsersRepository } from './legacy-users.repository';
import { SearchLegacyUsersResult } from './legacy.types';

@Injectable()
export class LegacyUserSearchService {
  constructor(
    private readonly authService: AuthService,
    private readonly legacyUsersRepository: LegacyUsersRepository,
    private readonly legacyUserCandidateMapper: LegacyUserCandidateMapper,
  ) {}

  async searchByDisplayName(
    authorizationHeader: string | undefined,
    displayName: string,
  ): Promise<SearchLegacyUsersResult> {
    const { user } =
      await this.authService.verifyAuthorizationHeader(authorizationHeader);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActivated) {
      throw new ForbiddenException('User is not activated');
    }

    const trimmedDisplayName = displayName.trim();

    if (!trimmedDisplayName) {
      throw new BadRequestException('Display name is required');
    }

    const legacyUsers =
      await this.legacyUsersRepository.findByDisplayName(trimmedDisplayName);

    return {
      legacyUsers: legacyUsers.map((legacyUser) =>
        this.legacyUserCandidateMapper.toCandidate(legacyUser),
      ),
    };
  }
}
