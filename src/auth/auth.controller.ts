import { Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthVerifyResult } from './auth.types';

interface AuthVerifyResponse {
  data: AuthVerifyResult;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Firebase authentication token' })
  @ApiOkResponse({ description: 'Authentication token verification result' })
  async verify(@Req() request: Request): Promise<AuthVerifyResponse> {
    const result = await this.authService.verifyAuthorizationHeader(
      request.headers.authorization,
    );

    return { data: result };
  }
}
