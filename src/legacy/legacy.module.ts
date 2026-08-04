import { Module } from '@nestjs/common';
import { DrinkConfigurationsModule } from '../drink-configurations/drink-configurations.module';
import { AuthModule } from '../auth/auth.module';
import { LegacyDrinkOptionMapper } from './legacy-drink-option.mapper';
import { LegacyPreferredDrinkImportService } from './legacy-preferred-drink-import.service';
import { LegacyProfileImportService } from './legacy-profile-import.service';
import { LegacyUserCandidateMapper } from './legacy-user-candidate.mapper';
import { LegacyUserSearchService } from './legacy-user-search.service';
import { LegacyUsersController } from './legacy-users.controller';
import { LegacyUsersRepository } from './legacy-users.repository';

@Module({
  imports: [AuthModule, DrinkConfigurationsModule],
  controllers: [LegacyUsersController],
  providers: [
    LegacyUsersRepository,
    LegacyUserCandidateMapper,
    LegacyUserSearchService,
    LegacyDrinkOptionMapper,
    LegacyPreferredDrinkImportService,
    LegacyProfileImportService,
  ],
  exports: [
    LegacyUsersRepository,
    LegacyUserCandidateMapper,
    LegacyUserSearchService,
    LegacyDrinkOptionMapper,
    LegacyPreferredDrinkImportService,
    LegacyProfileImportService,
  ],
})
export class LegacyModule {}
