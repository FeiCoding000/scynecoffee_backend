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
import { UserRole, UserStatus } from '@prisma/client';
import { ActivateUserDto } from './dto/activate-user.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ActivateUserResult } from './users.types';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<Pick<UsersService, 'activateUser'>>;

  beforeEach(async () => {
    usersService = {
      activateUser: jest.fn(),
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
