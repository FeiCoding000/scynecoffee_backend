import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ImportLegacyProfileDto {
  @ApiProperty({ example: 'legacy-user-1' })
  @IsString()
  @IsNotEmpty()
  legacyUserId!: string;
}
