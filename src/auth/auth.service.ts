import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import { DecodedIdToken } from 'firebase-admin/auth';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { FirebaseAdminService } from '../infrastructure/firebase/firebase-admin.service';
import {
  AuthenticatedUserDto,
  AuthVerifyResult,
  FirebaseUserContext,
} from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly prismaService: PrismaService,
  ) {}

  async verifyAuthorizationHeader(
    authorizationHeader?: string,
  ): Promise<AuthVerifyResult> {
    const token = this.extractBearerToken(authorizationHeader);
    return this.verifyToken(token);
  }

  async verifyToken(idToken: string): Promise<AuthVerifyResult> {
    const decodedToken = await this.verifyFirebaseToken(idToken);
    const firebaseUser = this.toFirebaseUserContext(decodedToken);

    const user = await this.prismaService.user.findUnique({
      where: { firebaseUid: firebaseUser.uid },
    });

    return {
      user: user ? this.toAuthenticatedUserDto(user) : null,
      firebaseUser,
      isActivated: Boolean(user?.isActivated),
    };
  }

  extractBearerToken(authorizationHeader?: string): string {
    if (!authorizationHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    return token;
  }

  private async verifyFirebaseToken(idToken: string): Promise<DecodedIdToken> {
    try {
      return await this.firebaseAdminService.verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private toFirebaseUserContext(
    decodedToken: DecodedIdToken,
  ): FirebaseUserContext {
    const name: unknown = decodedToken.name;

    return {
      uid: decodedToken.uid,
      googleEmail: decodedToken.email ?? null,
      name: typeof name === 'string' ? name : undefined,
    };
  }

  private toAuthenticatedUserDto(user: User): AuthenticatedUserDto {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      googleEmail: user.googleEmail,
      role: user.role,
      status: user.status,
      isActivated: user.isActivated,
    };
  }
}
