import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDrinkConfigurationDto } from '../../drink-configurations/dto/create-drink-configuration.dto';

export class UpdatePreferredDrinkDto {
  @ApiPropertyOptional({ example: 'Afternoon Coffee' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  displayName?: string;

  @ApiPropertyOptional({ example: '7e7b4f23-8ab2-4b32-a2a5-8f83b30de123' })
  @IsOptional()
  @IsUUID()
  drinkConfigurationId?: string;

  @ApiPropertyOptional({ type: CreateDrinkConfigurationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDrinkConfigurationDto)
  drinkConfiguration?: CreateDrinkConfigurationDto;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
