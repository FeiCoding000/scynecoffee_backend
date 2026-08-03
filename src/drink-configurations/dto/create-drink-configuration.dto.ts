import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DrinkCategory,
  DrinkStrength,
  MilkType,
  PortionAmount,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDrinkConfigurationDto {
  @ApiProperty({ enum: DrinkCategory, example: DrinkCategory.COFFEE })
  @IsEnum(DrinkCategory)
  category!: DrinkCategory;

  @ApiProperty({ example: 'Flat White' })
  @IsString()
  @IsNotEmpty()
  drinkType!: string;

  @ApiPropertyOptional({ enum: MilkType, example: MilkType.FULL })
  @IsOptional()
  @IsEnum(MilkType)
  milk?: MilkType;

  @ApiPropertyOptional({ enum: DrinkStrength, example: DrinkStrength.ONE })
  @IsOptional()
  @IsEnum(DrinkStrength)
  strength?: DrinkStrength;

  @ApiPropertyOptional({ enum: PortionAmount, example: PortionAmount.ZERO })
  @IsOptional()
  @IsEnum(PortionAmount)
  sugar?: PortionAmount;

  @ApiPropertyOptional({ enum: PortionAmount, example: PortionAmount.ZERO })
  @IsOptional()
  @IsEnum(PortionAmount)
  sweetener?: PortionAmount;

  @ApiPropertyOptional({ enum: PortionAmount, example: PortionAmount.ZERO })
  @IsOptional()
  @IsEnum(PortionAmount)
  teaBagCount?: PortionAmount;

  @ApiPropertyOptional({ enum: PortionAmount, example: PortionAmount.TWO })
  @IsOptional()
  @IsEnum(PortionAmount)
  powderScoops?: PortionAmount;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  iced?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  xhot?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  decaf?: boolean;
}
