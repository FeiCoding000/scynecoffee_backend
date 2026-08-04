import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivationCode, UserRole } from '@prisma/client';
import { randomInt } from 'crypto';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { GenerateActivationCodesDto } from './dto/generate-activation-codes.dto';
import {
  ActivationCodeDto,
  GenerateActivationCodesResult,
} from './activation-codes.types';

@Injectable()
export class ActivationCodesService {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  async generateActivationCodes(
    authorizationHeader: string | undefined,
    generateActivationCodesDto: GenerateActivationCodesDto,
  ): Promise<GenerateActivationCodesResult> {
    const { user } =
      await this.authService.verifyAuthorizationHeader(authorizationHeader);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActivated || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can generate activation codes');
    }

    const count = generateActivationCodesDto.count ?? 1;
    const role = generateActivationCodesDto.role ?? UserRole.STAFF;

    if (!Number.isInteger(count) || count < 1 || count > 100) {
      throw new BadRequestException('Count must be between 1 and 100');
    }

    if (role === UserRole.ADMIN) {
      throw new BadRequestException(
        'Admin activation codes cannot be generated',
      );
    }

    const activationCodes: ActivationCode[] = [];

    while (activationCodes.length < count) {
      const code = this.generateCode();

      try {
        const activationCode = await this.prismaService.activationCode.create({
          data: { code, role },
        });
        activationCodes.push(activationCode);
      } catch (error: unknown) {
        if (this.isUniqueConstraintError(error)) {
          continue;
        }

        throw error;
      }
    }

    return {
      activationCodes: activationCodes.map((activationCode) =>
        this.toActivationCodeDto(activationCode),
      ),
    };
  }

  private generateCode(): string {
    const letters = Array.from({ length: 3 }, () =>
      String.fromCharCode(65 + randomInt(26)),
    ).join('');
    const digits = randomInt(1000).toString().padStart(3, '0');

    return `${letters}${digits}`;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }

  private toActivationCodeDto(
    activationCode: ActivationCode,
  ): ActivationCodeDto {
    return {
      id: activationCode.id,
      code: activationCode.code,
      role: activationCode.role,
      status: activationCode.status,
      createdAt: activationCode.createdAt.toISOString(),
    };
  }
}
