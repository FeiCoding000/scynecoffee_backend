jest.mock('firebase-admin/app', () => ({
  cert: jest.fn(),
  getApps: jest.fn(),
  initializeApp: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivationCodeStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { FirebaseUserContext } from '../auth/auth.types';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { UsersService } from './users.service';

interface TransactionMock {
  activationCode: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let authService: jest.Mocked<Pick<AuthService, 'verifyAuthorizationHeader'>>;
  let prismaService: {
    $transaction: jest.Mock;
  };
  let transaction: TransactionMock;

  const firebaseUser: FirebaseUserContext = {
    uid: 'firebase-uid-1',
    googleEmail: 'user@example.com',
    name: 'Test User',
  };

  const availableActivationCode = {
    id: 'activation-code-1',
    code: 'AB1234',
    role: UserRole.STAFF,
    status: ActivationCodeStatus.AVAILABLE,
    claimedByUserId: null,
    claimedAt: null,
    createdAt: new Date('2026-08-02T00:00:00.000Z'),
    updatedAt: new Date('2026-08-02T00:00:00.000Z'),
  };

  const createdUser = {
    id: 'user-1',
    firebaseUid: 'firebase-uid-1',
    email: null,
    googleEmail: 'user@example.com',
    displayName: '',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    isActivated: true,
    activatedAt: new Date('2026-08-02T00:00:00.000Z'),
    createdAt: new Date('2026-08-02T00:00:00.000Z'),
    updatedAt: new Date('2026-08-02T00:00:00.000Z'),
  };

  beforeEach(() => {
    authService = {
      verifyAuthorizationHeader: jest.fn(),
    };

    transaction = {
      activationCode: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    prismaService = {
      $transaction: jest.fn((callback: (tx: TransactionMock) => unknown) =>
        callback(transaction),
      ),
    };

    service = new UsersService(
      authService as unknown as AuthService,
      prismaService as unknown as PrismaService,
    );
  });

  it('throws BadRequestException when activation code is empty', async () => {
    await expect(
      service.activateUser('Bearer valid-token', { activationCode: '   ' }),
    ).rejects.toThrow(BadRequestException);
    expect(authService.verifyAuthorizationHeader).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when activation code does not exist', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: null,
      firebaseUser,
      isActivated: false,
    });
    transaction.activationCode.findUnique.mockResolvedValue(null);

    await expect(
      service.activateUser('Bearer valid-token', { activationCode: 'AB1234' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when activation code is not available', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: null,
      firebaseUser,
      isActivated: false,
    });
    transaction.activationCode.findUnique.mockResolvedValue({
      ...availableActivationCode,
      status: ActivationCodeStatus.CLAIMED,
    });

    await expect(
      service.activateUser('Bearer valid-token', { activationCode: 'AB1234' }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when Firebase UID is already activated', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: null,
      firebaseUser,
      isActivated: false,
    });
    transaction.activationCode.findUnique.mockResolvedValue(
      availableActivationCode,
    );
    transaction.user.findUnique.mockResolvedValueOnce(createdUser);

    await expect(
      service.activateUser('Bearer valid-token', { activationCode: 'AB1234' }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when Google email is already activated', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: null,
      firebaseUser,
      isActivated: false,
    });
    transaction.activationCode.findUnique.mockResolvedValue(
      availableActivationCode,
    );
    transaction.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createdUser);

    await expect(
      service.activateUser('Bearer valid-token', { activationCode: 'AB1234' }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates activated user, claims activation code, and returns preferredDrinkCount zero', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: null,
      firebaseUser,
      isActivated: false,
    });
    transaction.activationCode.findUnique.mockResolvedValue(
      availableActivationCode,
    );
    transaction.user.findUnique.mockResolvedValue(null);
    transaction.user.create.mockResolvedValue(createdUser);
    transaction.activationCode.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.activateUser('Bearer valid-token', {
      activationCode: ' ab1234 ',
    });

    expect(authService.verifyAuthorizationHeader).toHaveBeenCalledWith(
      'Bearer valid-token',
    );
    expect(transaction.activationCode.findUnique).toHaveBeenCalledWith({
      where: { code: 'AB1234' },
    });
    expect(transaction.user.create).toHaveBeenCalledWith({
      data: {
        firebaseUid: 'firebase-uid-1',
        googleEmail: 'user@example.com',
        displayName: '',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
        activatedAt: expect.any(Date) as Date,
      },
    });
    expect(transaction.activationCode.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'activation-code-1',
        status: ActivationCodeStatus.AVAILABLE,
      },
      data: {
        status: ActivationCodeStatus.CLAIMED,
        claimedByUserId: 'user-1',
        claimedAt: expect.any(Date) as Date,
      },
    });
    expect(result).toEqual({
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
    });
  });

  it('throws ConflictException when activation code claim fails', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: null,
      firebaseUser,
      isActivated: false,
    });
    transaction.activationCode.findUnique.mockResolvedValue(
      availableActivationCode,
    );
    transaction.user.findUnique.mockResolvedValue(null);
    transaction.user.create.mockResolvedValue(createdUser);
    transaction.activationCode.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.activateUser('Bearer valid-token', { activationCode: 'AB1234' }),
    ).rejects.toThrow(ConflictException);
  });
});
