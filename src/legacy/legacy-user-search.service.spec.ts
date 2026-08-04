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

import { BadRequestException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { LegacyUserCandidateMapper } from './legacy-user-candidate.mapper';
import { LegacyUserSearchService } from './legacy-user-search.service';
import { LegacyUsersRepository } from './legacy-users.repository';

describe('LegacyUserSearchService', () => {
  let service: LegacyUserSearchService;
  let authService: jest.Mocked<Pick<AuthService, 'verifyAuthorizationHeader'>>;
  let repository: jest.Mocked<Pick<LegacyUsersRepository, 'findByDisplayName'>>;
  let mapper: LegacyUserCandidateMapper;

  beforeEach(() => {
    authService = {
      verifyAuthorizationHeader: jest.fn().mockResolvedValue({
        user: {
          id: 'user-1',
          displayName: 'Chloe Woodburn',
          email: null,
          googleEmail: 'user@example.com',
          role: UserRole.STAFF,
          status: UserStatus.ACTIVE,
          isActivated: true,
        },
        firebaseUser: {
          uid: 'firebase-uid-1',
          googleEmail: 'user@example.com',
          name: 'Chloe Woodburn',
        },
        isActivated: true,
      }),
    };
    repository = {
      findByDisplayName: jest.fn(),
    };
    mapper = new LegacyUserCandidateMapper();
    service = new LegacyUserSearchService(
      authService as unknown as AuthService,
      repository as unknown as LegacyUsersRepository,
      mapper,
    );
  });

  it('throws BadRequestException when displayName is blank', async () => {
    await expect(
      service.searchByDisplayName('Bearer valid-token', '   '),
    ).rejects.toThrow(BadRequestException);
    expect(repository.findByDisplayName).not.toHaveBeenCalled();
  });

  it('returns empty legacyUsers when no legacy users match', async () => {
    repository.findByDisplayName.mockResolvedValue([]);

    await expect(
      service.searchByDisplayName('Bearer valid-token', ' Chloe Woodburn '),
    ).resolves.toEqual({ legacyUsers: [] });
    expect(repository.findByDisplayName).toHaveBeenCalledWith('Chloe Woodburn');
  });

  it('returns mapped legacy user candidates', async () => {
    repository.findByDisplayName.mockResolvedValue([
      {
        legacyUserId: 'legacy-user-1',
        displayName: 'Chloe Woodburn',
        firstName: 'Chloe',
        lastName: 'Woodburn',
        normalizedName: 'chloe woodburn',
        options: [{ title: 'Flat White' }],
      },
    ]);

    await expect(
      service.searchByDisplayName('Bearer valid-token', 'Chloe Woodburn'),
    ).resolves.toEqual({
      legacyUsers: [
        {
          legacyUserId: 'legacy-user-1',
          displayName: 'Chloe Woodburn',
          firstName: 'Chloe',
          lastName: 'Woodburn',
          preferredDrinkCount: 1,
        },
      ],
    });
  });
});
