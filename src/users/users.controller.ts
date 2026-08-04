import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
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
import { ImportLegacyProfileDto } from './dto/import-legacy-profile.dto';
import { UpdateCurrentUserProfileDto } from './dto/update-current-user-profile.dto';
import { UpdatePreferredDrinkDto } from './dto/update-preferred-drink.dto';
import { UsersService } from './users.service';
import { LegacyProfileImportService } from '../legacy/legacy-profile-import.service';
import { LegacyProfileImportResult } from '../legacy/legacy.types';
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

interface UpdateCurrentUserProfileResponse {
  data: UserDto;
}

interface ImportLegacyProfileResponse {
  data: LegacyProfileImportResult;
}

interface PreferredDrinkResponse {
  data: PreferredDrinkDto;
}

interface EmptyResponse {
  data: null;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly legacyProfileImportService: LegacyProfileImportService,
  ) {}

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

  @Patch('me/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ description: 'Current user profile updated' })
  async updateMyProfile(
    @Req() request: Request,
    @Body() updateCurrentUserProfileDto: UpdateCurrentUserProfileDto,
  ): Promise<UpdateCurrentUserProfileResponse> {
    const user = await this.usersService.updateCurrentUserProfile(
      request.headers.authorization,
      updateCurrentUserProfileDto,
    );

    return { data: user };
  }

  @Post('me/profile/import-legacy')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import selected legacy profile preferred drinks' })
  @ApiCreatedResponse({ description: 'Legacy profile imported' })
  async importLegacyProfile(
    @Req() request: Request,
    @Body() importLegacyProfileDto: ImportLegacyProfileDto,
  ): Promise<ImportLegacyProfileResponse> {
    const result =
      await this.legacyProfileImportService.importSelectedLegacyProfile(
        request.headers.authorization,
        importLegacyProfileDto.legacyUserId,
      );

    return { data: result };
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

  @Patch('me/preferences/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user preferred drink' })
  @ApiOkResponse({ description: 'Preferred drink updated' })
  async updateMyPreference(
    @Req() request: Request,
    @Param('id') preferredDrinkId: string,
    @Body() updatePreferredDrinkDto: UpdatePreferredDrinkDto,
  ): Promise<PreferredDrinkResponse> {
    const preferredDrink = await this.usersService.updateCurrentUserPreference(
      request.headers.authorization,
      preferredDrinkId,
      updatePreferredDrinkDto,
    );

    return { data: preferredDrink };
  }

  @Delete('me/preferences/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete current user preferred drink' })
  @ApiOkResponse({ description: 'Preferred drink deleted' })
  async deleteMyPreference(
    @Req() request: Request,
    @Param('id') preferredDrinkId: string,
  ): Promise<EmptyResponse> {
    await this.usersService.deleteCurrentUserPreference(
      request.headers.authorization,
      preferredDrinkId,
    );

    return { data: null };
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
