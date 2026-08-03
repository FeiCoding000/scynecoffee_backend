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
import { UsersService } from './users.service';
import { ActivateUserResult, UserDto } from './users.types';

interface ActivateUserResponse {
  data: ActivateUserResult;
}

interface GetCurrentUserResponse {
  data: UserDto;
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
