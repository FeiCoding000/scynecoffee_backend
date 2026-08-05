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
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivationCodeStatus,
  DrinkCategory,
  DrinkStrength,
  MilkType,
  PortionAmount,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { FirebaseUserContext } from '../auth/auth.types';
import { DrinkConfigurationsService } from '../drink-configurations/drink-configurations.service';
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
    preferredDrink: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
    };
    drinkConfiguration: {
      findUnique: jest.Mock;
    };
    user: {
      update: jest.Mock;
    };
  };
  let drinkConfigurationsService: jest.Mocked<
    Pick<DrinkConfigurationsService, 'findOrCreate'>
  >;
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
    drinkConfigurationsService = {
      findOrCreate: jest.fn(),
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
      preferredDrink: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      drinkConfiguration: {
        findUnique: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
    };

    prismaService.preferredDrink.count.mockResolvedValue(0);

    service = new UsersService(
      authService as unknown as AuthService,
      prismaService as unknown as PrismaService,
      drinkConfigurationsService as unknown as DrinkConfigurationsService,
    );
  });

  it('returns current user from verified authorization header', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: {
        id: 'user-1',
        displayName: 'Test User',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      firebaseUser,
      isActivated: true,
    });

    await expect(service.getCurrentUser('Bearer valid-token')).resolves.toEqual(
      {
        id: 'user-1',
        displayName: 'Test User',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
    );
    expect(authService.verifyAuthorizationHeader).toHaveBeenCalledWith(
      'Bearer valid-token',
    );
  });

  it('throws NotFoundException when current Firebase user is not activated', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: null,
      firebaseUser,
      isActivated: false,
    });

    await expect(service.getCurrentUser('Bearer valid-token')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ForbiddenException when updating profile for unactivated user', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: {
        id: 'user-1',
        displayName: '',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: false,
      },
      firebaseUser,
      isActivated: false,
    });

    await expect(
      service.updateCurrentUserProfile('Bearer valid-token', {
        displayName: 'Chloe Woodburn',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('updates current user displayName', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: {
        id: 'user-1',
        displayName: '',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      firebaseUser,
      isActivated: true,
    });
    prismaService.user.update.mockResolvedValue({
      ...createdUser,
      displayName: 'Chloe Woodburn',
    });

    await expect(
      service.updateCurrentUserProfile('Bearer valid-token', {
        displayName: ' Chloe Woodburn ',
      }),
    ).resolves.toMatchObject({ displayName: 'Chloe Woodburn' });
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        displayName: 'Chloe Woodburn',
        isProfileSetupCompleted: true,
      },
    });
  });

  it('returns current user preferred drinks', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: {
        id: 'user-1',
        displayName: 'Test User',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      firebaseUser,
      isActivated: true,
    });
    prismaService.preferredDrink.findMany.mockResolvedValue([
      {
        id: 'preferred-drink-1',
        userId: 'user-1',
        drinkConfigurationId: 'drink-configuration-1',
        displayName: 'Morning Coffee',
        sortOrder: null,
        isDefault: false,
        createdAt: new Date('2026-08-03T00:00:00.000Z'),
        updatedAt: new Date('2026-08-03T00:00:00.000Z'),
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
          createdAt: new Date('2026-08-03T00:00:00.000Z'),
          updatedAt: new Date('2026-08-03T00:00:00.000Z'),
        },
      },
    ]);

    await expect(
      service.getCurrentUserPreferences('Bearer valid-token'),
    ).resolves.toEqual([
      {
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
      },
    ]);
    expect(prismaService.preferredDrink.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: { drinkConfiguration: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  });

  it('creates current user preference with existing drink configuration id', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: {
        id: 'user-1',
        displayName: 'Test User',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      firebaseUser,
      isActivated: true,
    });
    const drinkConfiguration = {
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
      createdAt: new Date('2026-08-03T00:00:00.000Z'),
      updatedAt: new Date('2026-08-03T00:00:00.000Z'),
    };
    prismaService.drinkConfiguration.findUnique.mockResolvedValue(
      drinkConfiguration,
    );
    prismaService.preferredDrink.create.mockResolvedValue({
      id: 'preferred-drink-1',
      userId: 'user-1',
      drinkConfigurationId: 'drink-configuration-1',
      displayName: 'Morning Coffee',
      sortOrder: 0,
      isDefault: true,
      createdAt: new Date('2026-08-03T00:00:00.000Z'),
      updatedAt: new Date('2026-08-03T00:00:00.000Z'),
      drinkConfiguration,
    });

    await expect(
      service.createCurrentUserPreference('Bearer valid-token', {
        displayName: ' Morning Coffee ',
        drinkConfigurationId: 'drink-configuration-1',
      }),
    ).resolves.toMatchObject({
      id: 'preferred-drink-1',
      displayName: 'Morning Coffee',
      drinkConfigurationId: 'drink-configuration-1',
    });
    expect(prismaService.preferredDrink.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        drinkConfigurationId: 'drink-configuration-1',
        displayName: 'Morning Coffee',
        sortOrder: 0,
        isDefault: true,
      },
      include: { drinkConfiguration: true },
    });
  });

  it('creates current user preference with new drink configuration input', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: {
        id: 'user-1',
        displayName: 'Test User',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      firebaseUser,
      isActivated: true,
    });
    drinkConfigurationsService.findOrCreate.mockResolvedValue({
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
    });
    prismaService.drinkConfiguration.findUnique.mockResolvedValue({
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
      createdAt: new Date('2026-08-03T00:00:00.000Z'),
      updatedAt: new Date('2026-08-03T00:00:00.000Z'),
    });
    prismaService.preferredDrink.create.mockResolvedValue({
      id: 'preferred-drink-1',
      userId: 'user-1',
      drinkConfigurationId: 'drink-configuration-1',
      displayName: 'Morning Coffee',
      sortOrder: null,
      isDefault: false,
      createdAt: new Date('2026-08-03T00:00:00.000Z'),
      updatedAt: new Date('2026-08-03T00:00:00.000Z'),
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
        createdAt: new Date('2026-08-03T00:00:00.000Z'),
        updatedAt: new Date('2026-08-03T00:00:00.000Z'),
      },
    });

    await service.createCurrentUserPreference('Bearer valid-token', {
      displayName: 'Morning Coffee',
      drinkConfiguration: {
        category: DrinkCategory.COFFEE,
        drinkType: 'Flat White',
      },
    });

    expect(drinkConfigurationsService.findOrCreate).toHaveBeenCalledWith({
      category: DrinkCategory.COFFEE,
      drinkType: 'Flat White',
    });
  });

  it('throws BadRequestException when preference create payload has neither config id nor config input', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: {
        id: 'user-1',
        displayName: 'Test User',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      firebaseUser,
      isActivated: true,
    });

    await expect(
      service.createCurrentUserPreference('Bearer valid-token', {
        displayName: 'Morning Coffee',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when preference create payload has both config id and config input', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: {
        id: 'user-1',
        displayName: 'Test User',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      firebaseUser,
      isActivated: true,
    });

    await expect(
      service.createCurrentUserPreference('Bearer valid-token', {
        displayName: 'Morning Coffee',
        drinkConfigurationId: 'drink-configuration-1',
        drinkConfiguration: {
          category: DrinkCategory.COFFEE,
          drinkType: 'Flat White',
        },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when preference drink configuration id does not exist', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: {
        id: 'user-1',
        displayName: 'Test User',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      firebaseUser,
      isActivated: true,
    });
    prismaService.drinkConfiguration.findUnique.mockResolvedValue(null);

    await expect(
      service.createCurrentUserPreference('Bearer valid-token', {
        displayName: 'Morning Coffee',
        drinkConfigurationId: 'drink-configuration-1',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates current user preference display name', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: {
        id: 'user-1',
        displayName: 'Test User',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      firebaseUser,
      isActivated: true,
    });
    prismaService.preferredDrink.findFirst.mockResolvedValue({
      id: 'preferred-drink-1',
      userId: 'user-1',
    });
    prismaService.preferredDrink.update.mockResolvedValue({
      id: 'preferred-drink-1',
      userId: 'user-1',
      drinkConfigurationId: 'drink-configuration-1',
      displayName: 'Afternoon Coffee',
      sortOrder: null,
      isDefault: false,
      createdAt: new Date('2026-08-03T00:00:00.000Z'),
      updatedAt: new Date('2026-08-03T00:00:00.000Z'),
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
        createdAt: new Date('2026-08-03T00:00:00.000Z'),
        updatedAt: new Date('2026-08-03T00:00:00.000Z'),
      },
    });

    await expect(
      service.updateCurrentUserPreference(
        'Bearer valid-token',
        'preferred-drink-1',
        { displayName: ' Afternoon Coffee ' },
      ),
    ).resolves.toMatchObject({
      id: 'preferred-drink-1',
      displayName: 'Afternoon Coffee',
    });
    expect(prismaService.preferredDrink.findFirst).toHaveBeenCalledWith({
      where: { id: 'preferred-drink-1', userId: 'user-1' },
    });
    expect(prismaService.preferredDrink.update).toHaveBeenCalledWith({
      where: { id: 'preferred-drink-1' },
      data: { displayName: 'Afternoon Coffee' },
      include: { drinkConfiguration: true },
    });
  });

  it('throws NotFoundException when updating another user preferred drink', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: {
        id: 'user-1',
        displayName: 'Test User',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      firebaseUser,
      isActivated: true,
    });
    prismaService.preferredDrink.findFirst.mockResolvedValue(null);

    await expect(
      service.updateCurrentUserPreference(
        'Bearer valid-token',
        'preferred-drink-1',
        { displayName: 'Afternoon Coffee' },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('deletes current user preference', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: {
        id: 'user-1',
        displayName: 'Test User',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      firebaseUser,
      isActivated: true,
    });
    prismaService.preferredDrink.deleteMany.mockResolvedValue({ count: 1 });

    await expect(
      service.deleteCurrentUserPreference(
        'Bearer valid-token',
        'preferred-drink-1',
      ),
    ).resolves.toBeUndefined();
    expect(prismaService.preferredDrink.deleteMany).toHaveBeenCalledWith({
      where: { id: 'preferred-drink-1', userId: 'user-1' },
    });
  });

  it('throws NotFoundException when deleting another user preferred drink', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: {
        id: 'user-1',
        displayName: 'Test User',
        email: null,
        googleEmail: 'user@example.com',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
      },
      firebaseUser,
      isActivated: true,
    });
    prismaService.preferredDrink.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      service.deleteCurrentUserPreference(
        'Bearer valid-token',
        'preferred-drink-1',
      ),
    ).rejects.toThrow(NotFoundException);
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

  it('throws ConflictException when concurrent user creation hits unique constraint', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: null,
      firebaseUser,
      isActivated: false,
    });
    transaction.activationCode.findUnique.mockResolvedValue(
      availableActivationCode,
    );
    transaction.user.findUnique.mockResolvedValue(null);
    transaction.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.activateUser('Bearer valid-token', { activationCode: 'AB1234' }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates activated user and claims activation code', async () => {
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
