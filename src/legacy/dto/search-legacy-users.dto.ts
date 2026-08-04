import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchLegacyUsersDto {
  @ApiProperty({ example: 'Chloe Woodburn' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;
}
