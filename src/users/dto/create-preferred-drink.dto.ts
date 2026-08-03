import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDrinkConfigurationDto } from '../../drink-configurations/dto/create-drink-configuration.dto';

export class CreatePreferredDrinkDto {
  @ApiProperty({ example: 'Morning Coffee' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiPropertyOptional({ example: '7e7b4f23-8ab2-4b32-a2a5-8f83b30de123' })
  @IsOptional()
  @IsUUID()
  drinkConfigurationId?: string;

  @ApiPropertyOptional({ type: CreateDrinkConfigurationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDrinkConfigurationDto)
  drinkConfiguration?: CreateDrinkConfigurationDto;
}
