import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GenerateActivationCodesDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 100, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  count?: number;

  @ApiPropertyOptional({
    enum: [UserRole.STAFF, UserRole.BARISTA],
    default: UserRole.STAFF,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
