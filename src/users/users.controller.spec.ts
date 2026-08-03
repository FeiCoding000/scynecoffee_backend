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
    >
  >;

  beforeEach(async () => {
    usersService = {
      activateUser: jest.fn(),
      getCurrentUser: jest.fn(),
      getCurrentUserPreferences: jest.fn(),
      createCurrentUserPreference: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
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
      preferredDrinkCount: 0,
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
