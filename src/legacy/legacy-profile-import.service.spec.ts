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
import { UserRole, UserStatus } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { FirebaseUserContext } from '../auth/auth.types';
import { LegacyPreferredDrinkImportService } from './legacy-preferred-drink-import.service';
import { LegacyProfileImportService } from './legacy-profile-import.service';
import { LegacyUsersRepository } from './legacy-users.repository';

describe('LegacyProfileImportService', () => {
  let service: LegacyProfileImportService;
  let authService: jest.Mocked<Pick<AuthService, 'verifyAuthorizationHeader'>>;
  let repository: jest.Mocked<Pick<LegacyUsersRepository, 'findById'>>;
  let importService: jest.Mocked<
    Pick<LegacyPreferredDrinkImportService, 'importForUser'>
  >;

  const firebaseUser: FirebaseUserContext = {
    uid: 'firebase-uid-1',
    googleEmail: 'user@example.com',
    name: 'Chloe Woodburn',
  };

  const user = {
    id: 'user-1',
    displayName: 'Chloe Woodburn',
    email: null,
    googleEmail: 'user@example.com',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    isActivated: true,
  };

  beforeEach(() => {
    authService = {
      verifyAuthorizationHeader: jest.fn(),
    };
    repository = {
      findById: jest.fn(),
    };
    importService = {
      importForUser: jest.fn(),
    };
    service = new LegacyProfileImportService(
      authService as unknown as AuthService,
      repository as unknown as LegacyUsersRepository,
      importService as unknown as LegacyPreferredDrinkImportService,
    );
  });

  it('throws NotFoundException when current user is missing', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: null,
      firebaseUser,
      isActivated: false,
    });

    await expect(
      service.importSelectedLegacyProfile(
        'Bearer valid-token',
        'legacy-user-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when current user is not activated', async () => {
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user: { ...user, isActivated: false },
      firebaseUser,
      isActivated: false,
    });

    await expect(
      service.importSelectedLegacyProfile(
        'Bearer valid-token',
        'legacy-user-1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('imports selected legacy user', async () => {
    const legacyUser = {
      legacyUserId: 'legacy-user-1',
      displayName: 'Chloe Woodburn',
      firstName: 'Chloe',
      lastName: 'Woodburn',
      normalizedName: 'chloe woodburn',
      options: [{ title: 'Flat White' }],
    };
    authService.verifyAuthorizationHeader.mockResolvedValue({
      user,
      firebaseUser,
      isActivated: true,
    });
    repository.findById.mockResolvedValue(legacyUser);
    importService.importForUser.mockResolvedValue(1);

    await expect(
      service.importSelectedLegacyProfile(
        'Bearer valid-token',
        ' legacy-user-1 ',
      ),
    ).resolves.toEqual({
      status: 'legacy_profile_imported',
      user,
      importedPreferredDrinkCount: 1,
    });
    expect(repository.findById).toHaveBeenCalledWith('legacy-user-1');
    expect(importService.importForUser).toHaveBeenCalledWith(user, legacyUser);
  });
});
