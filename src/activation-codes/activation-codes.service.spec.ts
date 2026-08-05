jest.mock('firebase-admin/app', () => ({
  cert: jest.fn(),
  getApps: jest.fn(),
  initializeApp: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
}));

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ActivationCodeStatus, UserRole, UserStatus } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { ActivationCodesService } from './activation-codes.service';

describe('ActivationCodesService', () => {
  let service: ActivationCodesService;
  let authService: jest.Mocked<Pick<AuthService, 'verifyAuthorizationHeader'>>;
  let prismaService: {
    activationCode: {
      create: jest.Mock;
    };
  };

  const adminUser = {
    id: 'admin-user-1',
    displayName: 'Admin User',
    email: null,
    googleEmail: 'admin@example.com',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    isActivated: true,
  };

  beforeEach(() => {
    authService = {
      verifyAuthorizationHeader: jest.fn(),
    };
    prismaService = {
      activationCode: {
        create: jest.fn(),
      },
    };
    service = new ActivationCodesService(
      authService as unknown as AuthService,
      prismaService as unknown as PrismaService,
    );
  });

  it('throws NotFoundException when current user is missing', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: null,
      firebaseUser: {
        uid: 'firebase-uid-1',
        googleEmail: 'user@example.com',
      },
      isActivated: false,
    });

    await expect(
      service.generateActivationCodes('Bearer valid-token', {}),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when current user is not admin', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: { ...adminUser, role: UserRole.STAFF },
      firebaseUser: {
        uid: 'firebase-uid-1',
        googleEmail: 'user@example.com',
      },
      isActivated: true,
    });

    await expect(
      service.generateActivationCodes('Bearer valid-token', {}),
    ).rejects.toThrow(ForbiddenException);
  });

  it('generates one staff activation code by default', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: adminUser,
      firebaseUser: {
        uid: 'firebase-uid-1',
        googleEmail: 'admin@example.com',
      },
      isActivated: true,
    });
    prismaService.activationCode.create.mockResolvedValue({
      id: 'activation-code-1',
      code: 'ABC123',
      role: UserRole.STAFF,
      status: ActivationCodeStatus.AVAILABLE,
      claimedByUserId: null,
      claimedAt: null,
      createdAt: new Date('2026-08-04T00:00:00.000Z'),
      updatedAt: new Date('2026-08-04T00:00:00.000Z'),
    });

    await expect(
      service.generateActivationCodes('Bearer valid-token', {}),
    ).resolves.toEqual({
      activationCodes: [
        {
          id: 'activation-code-1',
          code: 'ABC123',
          role: UserRole.STAFF,
          status: ActivationCodeStatus.AVAILABLE,
          createdAt: '2026-08-04T00:00:00.000Z',
        },
      ],
    });
    expect(prismaService.activationCode.create).toHaveBeenCalledWith({
      data: {
        code: expect.stringMatching(/^[A-Z]{3}\d{3}$/) as string,
        role: UserRole.STAFF,
      },
    });
  });

  it('generates requested number of staff activation codes', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: adminUser,
      firebaseUser: {
        uid: 'firebase-uid-1',
        googleEmail: 'admin@example.com',
      },
      isActivated: true,
    });
    prismaService.activationCode.create
      .mockResolvedValueOnce({
        id: 'activation-code-1',
        code: 'ABC123',
        role: UserRole.STAFF,
        status: ActivationCodeStatus.AVAILABLE,
        claimedByUserId: null,
        claimedAt: null,
        createdAt: new Date('2026-08-04T00:00:00.000Z'),
        updatedAt: new Date('2026-08-04T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'activation-code-2',
        code: 'DEF456',
        role: UserRole.STAFF,
        status: ActivationCodeStatus.AVAILABLE,
        claimedByUserId: null,
        claimedAt: null,
        createdAt: new Date('2026-08-04T00:00:00.000Z'),
        updatedAt: new Date('2026-08-04T00:00:00.000Z'),
      });

    const result = await service.generateActivationCodes('Bearer valid-token', {
      count: 2,
    });

    expect(result.activationCodes).toHaveLength(2);
    expect(prismaService.activationCode.create).toHaveBeenCalledTimes(2);
    expect(prismaService.activationCode.create).toHaveBeenCalledWith({
      data: {
        code: expect.stringMatching(/^[A-Z]{3}\d{3}$/) as string,
        role: UserRole.STAFF,
      },
    });
  });
});
