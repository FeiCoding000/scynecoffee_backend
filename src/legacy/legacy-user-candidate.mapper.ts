import { Injectable } from '@nestjs/common';
import { LegacyUser, LegacyUserCandidateDto } from './legacy.types';

@Injectable()
export class LegacyUserCandidateMapper {
  toCandidate(legacyUser: LegacyUser): LegacyUserCandidateDto {
    return {
      legacyUserId: legacyUser.legacyUserId,
      displayName: legacyUser.displayName,
      firstName: legacyUser.firstName,
      lastName: legacyUser.lastName,
      preferredDrinkCount: Array.isArray(legacyUser.options)
        ? legacyUser.options.length
        : 0,
    };
  }
}
