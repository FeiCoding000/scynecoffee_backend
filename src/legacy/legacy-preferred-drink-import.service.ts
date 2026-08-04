import { Injectable } from '@nestjs/common';
import { DrinkConfigurationsService } from '../drink-configurations/drink-configurations.service';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { UserDto } from '../users/users.types';
import { LegacyDrinkOptionMapper } from './legacy-drink-option.mapper';
import { LegacyUser } from './legacy.types';

@Injectable()
export class LegacyPreferredDrinkImportService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly drinkConfigurationsService: DrinkConfigurationsService,
    private readonly legacyDrinkOptionMapper: LegacyDrinkOptionMapper,
  ) {}

  async importForUser(user: UserDto, legacyUser: LegacyUser): Promise<number> {
    const existingPreferredDrinkCount =
      await this.prismaService.preferredDrink.count({
        where: { userId: user.id },
      });
    let importedPreferredDrinkCount = 0;

    for (const [sortOrder, option] of legacyUser.options.entries()) {
      const mappedOption = this.legacyDrinkOptionMapper.map(option);

      if (!mappedOption) {
        continue;
      }

      const drinkConfiguration =
        await this.drinkConfigurationsService.findOrCreate(
          mappedOption.drinkConfiguration,
        );

      await this.prismaService.preferredDrink.create({
        data: {
          userId: user.id,
          drinkConfigurationId: drinkConfiguration.id,
          displayName: mappedOption.displayName,
          sortOrder,
          isDefault:
            existingPreferredDrinkCount === 0 &&
            importedPreferredDrinkCount === 0,
        },
      });

      importedPreferredDrinkCount += 1;
    }

    return importedPreferredDrinkCount;
  }
}
