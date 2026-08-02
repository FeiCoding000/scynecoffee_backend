import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ActivateUserDto } from './dto/activate-user.dto';
import { UsersService } from './users.service';
import { ActivateUserResult } from './users.types';

interface ActivateUserResponse {
  data: ActivateUserResult;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
