import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCurrentUserProfileDto {
  @ApiProperty({ example: 'Chloe Woodburn' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;
}
