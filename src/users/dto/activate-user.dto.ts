import { ApiProperty } from '@nestjs/swagger';

export class ActivateUserDto {
  @ApiProperty({ example: 'AB1234' })
  activationCode!: string;
}
