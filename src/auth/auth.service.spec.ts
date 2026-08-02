jest.mock('firebase-admin/app', () => ({
  cert: jest.fn(),
  getApps: jest.fn(),
  initializeApp: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { FirebaseAdminService } from '../infrastructure/firebase/firebase-admin.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let firebaseAdminService: jest.Mocked<
    Pick<FirebaseAdminService, 'verifyIdToken'>
  >;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
    };
  };

  const decodedToken: DecodedIdToken = {
    aud: 'test-project',
    auth_time: 0,
    email: 'user@example.com',
    exp: 0,
    firebase: {
      identities: {},
      sign_in_provider: 'google.com',
    },
    iat: 0,
    iss: 'https://securetoken.google.com/test-project',
    name: 'Test User',
    sub: 'firebase-uid-1',
    uid: 'firebase-uid-1',
  };

  beforeEach(async () => {
    firebaseAdminService = {
      verifyIdToken: jest.fn(),
    };

    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: FirebaseAdminService,
          useValue: firebaseAdminService,
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('extractBearerToken', () => {
    it('throws UnauthorizedException when Authorization header is missing', () => {
      expect(() => service.extractBearerToken()).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when Authorization header is not Bearer format', () => {
      expect(() => service.extractBearerToken('Basic abc')).toThrow(
        UnauthorizedException,
      );
    });

    it('returns token from Bearer Authorization header', () => {
      expect(service.extractBearerToken('Bearer firebase-token')).toBe(
        'firebase-token',
      );
    });
  });

  describe('verifyToken', () => {
    it('throws UnauthorizedException when Firebase token verification fails', async () => {
      firebaseAdminService.verifyIdToken.mockRejectedValue(
        new Error('invalid'),
      );

      await expect(service.verifyToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns inactive result when Firebase token is valid but local user does not exist', async () => {
      firebaseAdminService.verifyIdToken.mockResolvedValue(decodedToken);
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.verifyToken('valid-token');

      expect(firebaseAdminService.verifyIdToken).toHaveBeenCalledWith(
        'valid-token',
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { firebaseUid: 'firebase-uid-1' },
      });
      expect(result).toEqual({
        user: null,
        firebaseUser: {
          uid: 'firebase-uid-1',
          googleEmail: 'user@example.com',
          name: 'Test User',
        },
        isActivated: false,
      });
    });

    it('returns activated application user when local user exists', async () => {
      firebaseAdminService.verifyIdToken.mockResolvedValue(decodedToken);
      prismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        firebaseUid: 'firebase-uid-1',
        email: null,
        googleEmail: 'user@example.com',
        displayName: 'Test User',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        isActivated: true,
        activatedAt: new Date('2026-08-02T00:00:00.000Z'),
        createdAt: new Date('2026-08-02T00:00:00.000Z'),
        updatedAt: new Date('2026-08-02T00:00:00.000Z'),
      });

      const result = await service.verifyToken('valid-token');

      expect(result).toEqual({
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
      });
    });
  });
});
