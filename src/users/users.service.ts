import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivationCodeStatus, Prisma, User, UserStatus } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { ActivateUserDto } from './dto/activate-user.dto';
import { ActivateUserResult, UserDto } from './users.types';

@Injectable()
export class UsersService {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  async getCurrentUser(
    authorizationHeader: string | undefined,
  ): Promise<UserDto> {
    const { user } =
      await this.authService.verifyAuthorizationHeader(authorizationHeader);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async activateUser(
    authorizationHeader: string | undefined,
    activateUserDto: ActivateUserDto,
  ): Promise<ActivateUserResult> {
    const activationCode = activateUserDto.activationCode?.trim().toUpperCase();

    if (!activationCode) {
      throw new BadRequestException('Activation code is required');
    }

    const { firebaseUser } =
      await this.authService.verifyAuthorizationHeader(authorizationHeader);

    const user = await this.prismaService.$transaction(async (transaction) => {
      const code = await transaction.activationCode.findUnique({
        where: { code: activationCode },
      });

      if (!code) {
        throw new NotFoundException('Activation code not found');
      }

      if (code.status !== ActivationCodeStatus.AVAILABLE) {
        throw new ConflictException('Activation code is not available');
      }

      const existingUserByFirebaseUid = await transaction.user.findUnique({
        where: { firebaseUid: firebaseUser.uid },
      });

      if (existingUserByFirebaseUid) {
        throw new ConflictException('User is already activated');
      }

      if (firebaseUser.googleEmail) {
        const existingUserByGoogleEmail = await transaction.user.findUnique({
          where: { googleEmail: firebaseUser.googleEmail },
        });

        if (existingUserByGoogleEmail) {
          throw new ConflictException('Google email is already activated');
        }
      }

      let createdUser: User;

      try {
        createdUser = await transaction.user.create({
          data: {
            firebaseUid: firebaseUser.uid,
            googleEmail: firebaseUser.googleEmail,
            displayName: '',
            role: code.role,
            status: UserStatus.ACTIVE,
            isActivated: true,
            activatedAt: new Date(),
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException('User is already activated');
        }

        throw error;
      }

      const claimResult = await transaction.activationCode.updateMany({
        where: {
          id: code.id,
          status: ActivationCodeStatus.AVAILABLE,
        },
        data: {
          status: ActivationCodeStatus.CLAIMED,
          claimedByUserId: createdUser.id,
          claimedAt: new Date(),
        },
      });

      if (claimResult.count !== 1) {
        throw new ConflictException('Activation code is not available');
      }

      return createdUser;
    });

    return {
      status: 'activated',
      user: this.toUserDto(user),
      preferredDrinkCount: 0,
    };
  }

  private toUserDto(user: User): UserDto {
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
