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
import { FirebaseAdminService } from '../infrastructure/firebase/firebase-admin.service';
import { LegacyUsersRepository } from './legacy-users.repository';

describe('LegacyUsersRepository', () => {
  let repository: LegacyUsersRepository;
  let firebaseAdminService: jest.Mocked<
    Pick<FirebaseAdminService, 'getFirestore'>
  >;
  let collection: jest.Mock;
  let where: jest.Mock;
  let get: jest.Mock;
  let doc: jest.Mock;

  beforeEach(() => {
    get = jest.fn();
    where = jest.fn().mockReturnValue({ get });
    doc = jest.fn();
    collection = jest.fn().mockReturnValue({ where, doc });
    firebaseAdminService = {
      getFirestore: jest.fn().mockReturnValue({ collection }),
    };
    repository = new LegacyUsersRepository(
      firebaseAdminService as unknown as FirebaseAdminService,
    );
  });

  it('throws BadRequestException when displayName is blank', async () => {
    await expect(repository.findByDisplayName('   ')).rejects.toThrow(
      BadRequestException,
    );
    expect(firebaseAdminService.getFirestore).not.toHaveBeenCalled();
  });

  it('queries users by normalizedName and maps documents', async () => {
    get.mockResolvedValue({
      docs: [
        {
          id: 'legacy-user-1',
          data: () => ({
            firstName: 'Chloe',
            lastName: 'Woodburn',
            normalizedName: 'chloe woodburn',
            options: [{ title: 'Flat White' }],
          }),
        },
      ],
    });

    await expect(
      repository.findByDisplayName(' Chloe   Woodburn '),
    ).resolves.toEqual([
      {
        legacyUserId: 'legacy-user-1',
        displayName: 'Chloe Woodburn',
        firstName: 'Chloe',
        lastName: 'Woodburn',
        normalizedName: 'chloe woodburn',
        options: [{ title: 'Flat White' }],
      },
    ]);
    expect(collection).toHaveBeenCalledWith('customer');
    expect(where).toHaveBeenCalledWith(
      'normalizedName',
      '==',
      'chloe woodburn',
    );
    expect(where).toHaveBeenCalledWith('firstName', 'in', ['Chloe', 'chloe']);
  });

  it('returns null when legacy user id does not exist', async () => {
    const documentGet = jest.fn().mockResolvedValue({ exists: false });
    doc.mockReturnValue({ get: documentGet });

    await expect(repository.findById('legacy-user-1')).resolves.toBeNull();
  });
});
