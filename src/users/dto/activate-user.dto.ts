import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ActivateUserDto {
  @ApiProperty({ example: 'AB1234' })
  @IsString()
  @IsNotEmpty()
  activationCode!: string;
}
