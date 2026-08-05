import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivationCodeStatus,
  DrinkConfiguration,
  PreferredDrink,
  Prisma,
  User,
  UserStatus,
} from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { DrinkConfigurationsService } from '../drink-configurations/drink-configurations.service';
import { DrinkConfigurationDto } from '../drink-configurations/drink-configurations.types';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { ActivateUserDto } from './dto/activate-user.dto';
import { CreatePreferredDrinkDto } from './dto/create-preferred-drink.dto';
import { UpdateCurrentUserProfileDto } from './dto/update-current-user-profile.dto';
import { UpdatePreferredDrinkDto } from './dto/update-preferred-drink.dto';
import { ActivateUserResult, PreferredDrinkDto, UserDto } from './users.types';

type PreferredDrinkWithConfiguration = PreferredDrink & {
  drinkConfiguration: DrinkConfiguration;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
    private readonly drinkConfigurationsService: DrinkConfigurationsService,
  ) {}

  async getCurrentUser(
    authorizationHeader: string | undefined,
  ): Promise<UserDto> {
    const { user } =
      await this.authService.verifyAuthorizationHeader(authorizationHeader);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateCurrentUserProfile(
    authorizationHeader: string | undefined,
    updateCurrentUserProfileDto: UpdateCurrentUserProfileDto,
  ): Promise<UserDto> {
    const user = await this.getCurrentActivatedUser(authorizationHeader);
    const displayName = updateCurrentUserProfileDto.displayName.trim();

    if (!displayName) {
      throw new BadRequestException('Display name is required');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: user.id },
      data: { displayName, isProfileSetupCompleted: true },
    });

    return this.toUserDto(updatedUser);
  }

  async getCurrentUserPreferences(
    authorizationHeader: string | undefined,
  ): Promise<PreferredDrinkDto[]> {
    const user = await this.getCurrentUser(authorizationHeader);

    const preferredDrinks = await this.prismaService.preferredDrink.findMany({
      where: { userId: user.id },
      include: { drinkConfiguration: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return preferredDrinks.map((preferredDrink) =>
      this.toPreferredDrinkDto(preferredDrink),
    );
  }

  async createCurrentUserPreference(
    authorizationHeader: string | undefined,
    createPreferredDrinkDto: CreatePreferredDrinkDto,
  ): Promise<PreferredDrinkDto> {
    const user = await this.getCurrentUser(authorizationHeader);
    const displayName = createPreferredDrinkDto.displayName?.trim();

    if (!displayName) {
      throw new BadRequestException('Display name is required');
    }

    const hasDrinkConfigurationId = Boolean(
      createPreferredDrinkDto.drinkConfigurationId,
    );
    const hasDrinkConfiguration = Boolean(
      createPreferredDrinkDto.drinkConfiguration,
    );

    if (hasDrinkConfigurationId === hasDrinkConfiguration) {
      throw new BadRequestException(
        'Provide either drinkConfigurationId or drinkConfiguration',
      );
    }

    let drinkConfigurationId = createPreferredDrinkDto.drinkConfigurationId;

    if (createPreferredDrinkDto.drinkConfiguration) {
      const drinkConfiguration =
        await this.drinkConfigurationsService.findOrCreate(
          createPreferredDrinkDto.drinkConfiguration,
        );
      drinkConfigurationId = drinkConfiguration.id;
    }

    if (!drinkConfigurationId) {
      throw new BadRequestException('Drink configuration is required');
    }

    const drinkConfiguration =
      await this.prismaService.drinkConfiguration.findUnique({
        where: { id: drinkConfigurationId },
      });

    if (!drinkConfiguration) {
      throw new NotFoundException('Drink configuration not found');
    }

    const existingPreferredDrinkCount =
      await this.prismaService.preferredDrink.count({
        where: { userId: user.id },
      });

    const preferredDrink = await this.prismaService.preferredDrink.create({
      data: {
        userId: user.id,
        drinkConfigurationId,
        displayName,
        sortOrder: existingPreferredDrinkCount,
        isDefault: existingPreferredDrinkCount === 0,
      },
      include: { drinkConfiguration: true },
    });

    return this.toPreferredDrinkDto(preferredDrink);
  }

  async updateCurrentUserPreference(
    authorizationHeader: string | undefined,
    preferredDrinkId: string,
    updatePreferredDrinkDto: UpdatePreferredDrinkDto,
  ): Promise<PreferredDrinkDto> {
    const user = await this.getCurrentUser(authorizationHeader);

    const existingPreferredDrink =
      await this.prismaService.preferredDrink.findFirst({
        where: { id: preferredDrinkId, userId: user.id },
      });

    if (!existingPreferredDrink) {
      throw new NotFoundException('Preferred drink not found');
    }

    const data: Prisma.PreferredDrinkUpdateInput = {};

    if (updatePreferredDrinkDto.displayName !== undefined) {
      const displayName = updatePreferredDrinkDto.displayName.trim();

      if (!displayName) {
        throw new BadRequestException('Display name is required');
      }

      data.displayName = displayName;
    }

    if (updatePreferredDrinkDto.isDefault !== undefined) {
      data.isDefault = updatePreferredDrinkDto.isDefault;
    }

    const hasDrinkConfigurationId = Boolean(
      updatePreferredDrinkDto.drinkConfigurationId,
    );
    const hasDrinkConfiguration = Boolean(
      updatePreferredDrinkDto.drinkConfiguration,
    );

    if (hasDrinkConfigurationId && hasDrinkConfiguration) {
      throw new BadRequestException(
        'Provide either drinkConfigurationId or drinkConfiguration',
      );
    }

    if (hasDrinkConfigurationId || hasDrinkConfiguration) {
      const drinkConfigurationId = await this.resolveDrinkConfigurationId(
        updatePreferredDrinkDto.drinkConfigurationId,
        updatePreferredDrinkDto.drinkConfiguration,
      );
      data.drinkConfiguration = { connect: { id: drinkConfigurationId } };
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No preferred drink updates provided');
    }

    const preferredDrink = await this.prismaService.preferredDrink.update({
      where: { id: existingPreferredDrink.id },
      data,
      include: { drinkConfiguration: true },
    });

    return this.toPreferredDrinkDto(preferredDrink);
  }

  async deleteCurrentUserPreference(
    authorizationHeader: string | undefined,
    preferredDrinkId: string,
  ): Promise<void> {
    const user = await this.getCurrentUser(authorizationHeader);

    const deleteResult = await this.prismaService.preferredDrink.deleteMany({
      where: { id: preferredDrinkId, userId: user.id },
    });

    if (deleteResult.count !== 1) {
      throw new NotFoundException('Preferred drink not found');
    }
  }

  async activateUser(
    authorizationHeader: string | undefined,
    activateUserDto: ActivateUserDto,
  ): Promise<ActivateUserResult> {
    const activationCode = activateUserDto.activationCode?.trim().toUpperCase();

    if (!activationCode) {
      throw new BadRequestException('Activation code is required');
    }

    const { firebaseUser } =
      await this.authService.verifyAuthorizationHeader(authorizationHeader);

    const user = await this.prismaService.$transaction(async (transaction) => {
      const code = await transaction.activationCode.findUnique({
        where: { code: activationCode },
      });

      if (!code) {
        throw new NotFoundException('Activation code not found');
      }

      if (code.status !== ActivationCodeStatus.AVAILABLE) {
        throw new ConflictException('Activation code is not available');
      }

      const existingUserByFirebaseUid = await transaction.user.findUnique({
        where: { firebaseUid: firebaseUser.uid },
      });

      if (existingUserByFirebaseUid) {
        throw new ConflictException('User is already activated');
      }

      if (firebaseUser.googleEmail) {
        const existingUserByGoogleEmail = await transaction.user.findUnique({
          where: { googleEmail: firebaseUser.googleEmail },
        });

        if (existingUserByGoogleEmail) {
          throw new ConflictException('Google email is already activated');
        }
      }

      let createdUser: User;

      try {
        createdUser = await transaction.user.create({
          data: {
            firebaseUid: firebaseUser.uid,
            googleEmail: firebaseUser.googleEmail,
            displayName: '',
            role: code.role,
            status: UserStatus.ACTIVE,
            isActivated: true,
            activatedAt: new Date(),
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException('User is already activated');
        }

        throw error;
      }

      const claimResult = await transaction.activationCode.updateMany({
        where: {
          id: code.id,
          status: ActivationCodeStatus.AVAILABLE,
        },
        data: {
          status: ActivationCodeStatus.CLAIMED,
          claimedByUserId: createdUser.id,
          claimedAt: new Date(),
        },
      });

      if (claimResult.count !== 1) {
        throw new ConflictException('Activation code is not available');
      }

      return createdUser;
    });

    return {
      status: 'activated',
      user: this.toUserDto(user),
    };
  }

  private async getCurrentActivatedUser(
    authorizationHeader: string | undefined,
  ): Promise<UserDto> {
    const user = await this.getCurrentUser(authorizationHeader);

    if (!user.isActivated) {
      throw new ForbiddenException('User is not activated');
    }

    return user;
  }

  private async resolveDrinkConfigurationId(
    drinkConfigurationId: string | undefined,
    drinkConfigurationInput: CreatePreferredDrinkDto['drinkConfiguration'],
  ): Promise<string> {
    if (drinkConfigurationInput) {
      const drinkConfiguration =
        await this.drinkConfigurationsService.findOrCreate(
          drinkConfigurationInput,
        );

      return drinkConfiguration.id;
    }

    if (!drinkConfigurationId) {
      throw new BadRequestException('Drink configuration is required');
    }

    const drinkConfiguration =
      await this.prismaService.drinkConfiguration.findUnique({
        where: { id: drinkConfigurationId },
      });

    if (!drinkConfiguration) {
      throw new NotFoundException('Drink configuration not found');
    }

    return drinkConfigurationId;
  }

  private toUserDto(user: User): UserDto {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      googleEmail: user.googleEmail,
      role: user.role,
      status: user.status,
      isActivated: user.isActivated,
      isProfileSetupCompleted: user.isProfileSetupCompleted,
    };
  }

  private toPreferredDrinkDto(
    preferredDrink: PreferredDrinkWithConfiguration,
  ): PreferredDrinkDto {
    return {
      id: preferredDrink.id,
      displayName: preferredDrink.displayName,
      drinkConfigurationId: preferredDrink.drinkConfigurationId,
      sortOrder: preferredDrink.sortOrder,
      isDefault: preferredDrink.isDefault,
      drinkConfiguration: this.toDrinkConfigurationDto(
        preferredDrink.drinkConfiguration,
      ),
    };
  }

  private toDrinkConfigurationDto(
    drinkConfiguration: DrinkConfiguration,
  ): DrinkConfigurationDto {
    return {
      id: drinkConfiguration.id,
      category: drinkConfiguration.category,
      drinkType: drinkConfiguration.drinkType,
      milk: drinkConfiguration.milk,
      strength: drinkConfiguration.strength,
      sugar: drinkConfiguration.sugar,
      sweetener: drinkConfiguration.sweetener,
      teaBagCount: drinkConfiguration.teaBagCount,
      powderScoops: drinkConfiguration.powderScoops,
      iced: drinkConfiguration.iced,
      xhot: drinkConfiguration.xhot,
      decaf: drinkConfiguration.decaf,
    };
  }
}
