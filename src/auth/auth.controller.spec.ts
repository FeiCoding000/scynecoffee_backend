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
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthVerifyResult } from './auth.types';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Pick<AuthService, 'verifyAuthorizationHeader'>>;

  beforeEach(async () => {
    authService = {
      verifyAuthorizationHeader: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('returns auth verification result in response envelope', async () => {
    const verifyResult: AuthVerifyResult = {
      user: {
        id: 'user-1',
        displayName: 'Test User',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      firebaseUser: {
        uid: 'firebase-uid-1',
        googleEmail: 'user@example.com',
        name: 'Test User',
      },
      isActivated: true,
    };

    authService.verifyAuthorizationHeader.mockResolvedValue(verifyResult);

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Request;

    await expect(controller.verify(request)).resolves.toEqual({
      data: verifyResult,
    });
    expect(authService.verifyAuthorizationHeader).toHaveBeenCalledWith(
      'Bearer valid-token',
    );
  });
});
