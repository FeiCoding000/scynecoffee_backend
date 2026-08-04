jest.mock('firebase-admin/app', () => ({
  cert: jest.fn(),
  getApps: jest.fn(),
  initializeApp: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { LegacyProfileImportService } from '../legacy/legacy-profile-import.service';
import {
  DrinkCategory,
  DrinkStrength,
  MilkType,
  PortionAmount,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { ActivateUserDto } from './dto/activate-user.dto';
import { CreatePreferredDrinkDto } from './dto/create-preferred-drink.dto';
import { ImportLegacyProfileDto } from './dto/import-legacy-profile.dto';
import { UpdateCurrentUserProfileDto } from './dto/update-current-user-profile.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ActivateUserResult, PreferredDrinkDto, UserDto } from './users.types';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<
    Pick<
      UsersService,
      | 'activateUser'
      | 'getCurrentUser'
      | 'getCurrentUserPreferences'
      | 'createCurrentUserPreference'
      | 'updateCurrentUserPreference'
      | 'deleteCurrentUserPreference'
      | 'updateCurrentUserProfile'
    >
  >;
  let legacyProfileImportService: jest.Mocked<
    Pick<LegacyProfileImportService, 'importSelectedLegacyProfile'>
  >;

  beforeEach(async () => {
    usersService = {
      activateUser: jest.fn(),
      getCurrentUser: jest.fn(),
      getCurrentUserPreferences: jest.fn(),
      createCurrentUserPreference: jest.fn(),
      updateCurrentUserPreference: jest.fn(),
      deleteCurrentUserPreference: jest.fn(),
      updateCurrentUserProfile: jest.fn(),
    };
    legacyProfileImportService = {
      importSelectedLegacyProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: LegacyProfileImportService,
          useValue: legacyProfileImportService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('returns current user in response envelope', async () => {
    const user: UserDto = {
      id: 'user-1',
      displayName: 'Test User',
      email: null,
      googleEmail: 'user@example.com',
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      isActivated: true,
    };

    usersService.getCurrentUser.mockResolvedValue(user);

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Request;

    await expect(controller.getMe(request)).resolves.toEqual({ data: user });
    expect(usersService.getCurrentUser).toHaveBeenCalledWith(
      'Bearer valid-token',
    );
  });

  it('updates current user profile in response envelope', async () => {
    const updateCurrentUserProfileDto: UpdateCurrentUserProfileDto = {
      displayName: 'Chloe Woodburn',
    };
    const user: UserDto = {
      id: 'user-1',
      displayName: 'Chloe Woodburn',
      email: null,
      googleEmail: 'user@example.com',
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      isActivated: true,
    };
    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Request;

    usersService.updateCurrentUserProfile.mockResolvedValue(user);

    await expect(
      controller.updateMyProfile(request, updateCurrentUserProfileDto),
    ).resolves.toEqual({ data: user });
    expect(usersService.updateCurrentUserProfile).toHaveBeenCalledWith(
      'Bearer valid-token',
      updateCurrentUserProfileDto,
    );
  });

  it('imports selected legacy profile in response envelope', async () => {
    const importLegacyProfileDto: ImportLegacyProfileDto = {
      legacyUserId: 'legacy-user-1',
    };
    const result = {
      status: 'legacy_profile_imported' as const,
      user: {
        id: 'user-1',
        displayName: 'Chloe Woodburn',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      importedPreferredDrinkCount: 2,
    };
    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Request;

    legacyProfileImportService.importSelectedLegacyProfile.mockResolvedValue(
      result,
    );

    await expect(
      controller.importLegacyProfile(request, importLegacyProfileDto),
    ).resolves.toEqual({ data: result });
    expect(
      legacyProfileImportService.importSelectedLegacyProfile,
    ).toHaveBeenCalledWith('Bearer valid-token', 'legacy-user-1');
  });

  it('returns current user preferred drinks in response envelope', async () => {
    const preferredDrink: PreferredDrinkDto = {
      id: 'preferred-drink-1',
      displayName: 'Morning Coffee',
      drinkConfigurationId: 'drink-configuration-1',
      sortOrder: null,
      isDefault: false,
      drinkConfiguration: {
        id: 'drink-configuration-1',
        category: DrinkCategory.COFFEE,
        drinkType: 'Flat White',
        milk: MilkType.FULL,
        strength: DrinkStrength.ONE,
        sugar: PortionAmount.ZERO,
        sweetener: PortionAmount.ZERO,
        teaBagCount: null,
        powderScoops: null,
        iced: false,
        xhot: false,
        decaf: false,
      },
    };

    usersService.getCurrentUserPreferences.mockResolvedValue([preferredDrink]);

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Request;

    await expect(controller.getMyPreferences(request)).resolves.toEqual({
      data: [preferredDrink],
    });
    expect(usersService.getCurrentUserPreferences).toHaveBeenCalledWith(
      'Bearer valid-token',
    );
  });

  it('returns created current user preferred drink in response envelope', async () => {
    const createDto: CreatePreferredDrinkDto = {
      displayName: 'Morning Coffee',
      drinkConfigurationId: '7e7b4f23-8ab2-4b32-a2a5-8f83b30de123',
    };
    const preferredDrink: PreferredDrinkDto = {
      id: 'preferred-drink-1',
      displayName: 'Morning Coffee',
      drinkConfigurationId: '7e7b4f23-8ab2-4b32-a2a5-8f83b30de123',
      sortOrder: null,
      isDefault: false,
      drinkConfiguration: {
        id: '7e7b4f23-8ab2-4b32-a2a5-8f83b30de123',
        category: DrinkCategory.COFFEE,
        drinkType: 'Flat White',
        milk: MilkType.FULL,
        strength: DrinkStrength.ONE,
        sugar: PortionAmount.ZERO,
        sweetener: PortionAmount.ZERO,
        teaBagCount: null,
        powderScoops: null,
        iced: false,
        xhot: false,
        decaf: false,
      },
    };

    usersService.createCurrentUserPreference.mockResolvedValue(preferredDrink);

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Request;

    await expect(
      controller.createMyPreference(request, createDto),
    ).resolves.toEqual({ data: preferredDrink });
    expect(usersService.createCurrentUserPreference).toHaveBeenCalledWith(
      'Bearer valid-token',
      createDto,
    );
  });

  it('returns updated current user preferred drink in response envelope', async () => {
    const preferredDrink: PreferredDrinkDto = {
      id: 'preferred-drink-1',
      displayName: 'Afternoon Coffee',
      drinkConfigurationId: 'drink-configuration-1',
      sortOrder: null,
      isDefault: false,
      drinkConfiguration: {
        id: 'drink-configuration-1',
        category: DrinkCategory.COFFEE,
        drinkType: 'Flat White',
        milk: MilkType.FULL,
        strength: DrinkStrength.ONE,
        sugar: PortionAmount.ZERO,
        sweetener: PortionAmount.ZERO,
        teaBagCount: null,
        powderScoops: null,
        iced: false,
        xhot: false,
        decaf: false,
      },
    };

    usersService.updateCurrentUserPreference.mockResolvedValue(preferredDrink);

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Request;

    await expect(
      controller.updateMyPreference(request, 'preferred-drink-1', {
        displayName: 'Afternoon Coffee',
      }),
    ).resolves.toEqual({ data: preferredDrink });
    expect(usersService.updateCurrentUserPreference).toHaveBeenCalledWith(
      'Bearer valid-token',
      'preferred-drink-1',
      { displayName: 'Afternoon Coffee' },
    );
  });

  it('returns empty response envelope after deleting current user preferred drink', async () => {
    usersService.deleteCurrentUserPreference.mockResolvedValue(undefined);

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Request;

    await expect(
      controller.deleteMyPreference(request, 'preferred-drink-1'),
    ).resolves.toEqual({ data: null });
    expect(usersService.deleteCurrentUserPreference).toHaveBeenCalledWith(
      'Bearer valid-token',
      'preferred-drink-1',
    );
  });

  it('returns activation result in response envelope', async () => {
    const activateUserDto: ActivateUserDto = {
      activationCode: 'AB1234',
    };
    const activateUserResult: ActivateUserResult = {
      status: 'activated',
      user: {
        id: 'user-1',
        displayName: '',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
    };

    usersService.activateUser.mockResolvedValue(activateUserResult);

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Request;

    await expect(
      controller.activate(request, activateUserDto),
    ).resolves.toEqual({
      data: activateUserResult,
    });
    expect(usersService.activateUser).toHaveBeenCalledWith(
      'Bearer valid-token',
      activateUserDto,
    );
  });
});
