import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ActivateUserDto } from './dto/activate-user.dto';
import { CreatePreferredDrinkDto } from './dto/create-preferred-drink.dto';
import { UsersService } from './users.service';
import { ActivateUserResult, PreferredDrinkDto, UserDto } from './users.types';

interface ActivateUserResponse {
  data: ActivateUserResult;
}

interface GetCurrentUserResponse {
  data: UserDto;
}

interface PreferredDrinkListResponse {
  data: PreferredDrinkDto[];
}

interface PreferredDrinkResponse {
  data: PreferredDrinkDto;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Current user profile' })
  async getMe(@Req() request: Request): Promise<GetCurrentUserResponse> {
    const user = await this.usersService.getCurrentUser(
      request.headers.authorization,
    );

    return { data: user };
  }

  @Get('me/preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user preferred drinks' })
  @ApiOkResponse({ description: 'Current user preferred drinks' })
  async getMyPreferences(
    @Req() request: Request,
  ): Promise<PreferredDrinkListResponse> {
    const preferredDrinks = await this.usersService.getCurrentUserPreferences(
      request.headers.authorization,
    );

    return { data: preferredDrinks };
  }

  @Post('me/preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create current user preferred drink' })
  @ApiCreatedResponse({ description: 'Preferred drink created' })
  async createMyPreference(
    @Req() request: Request,
    @Body() createPreferredDrinkDto: CreatePreferredDrinkDto,
  ): Promise<PreferredDrinkResponse> {
    const preferredDrink = await this.usersService.createCurrentUserPreference(
      request.headers.authorization,
      createPreferredDrinkDto,
    );

    return { data: preferredDrink };
  }

  @Post('activate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate user account with activation code' })
  @ApiCreatedResponse({ description: 'User activated successfully' })
  async activate(
    @Req() request: Request,
    @Body() activateUserDto: ActivateUserDto,
  ): Promise<ActivateUserResponse> {
    const result = await this.usersService.activateUser(
      request.headers.authorization,
      activateUserDto,
    );

    return { data: result };
  }
}
