import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ActivationCodesService } from './activation-codes.service';
import { GenerateActivationCodesResult } from './activation-codes.types';
import { GenerateActivationCodesDto } from './dto/generate-activation-codes.dto';

interface GenerateActivationCodesResponse {
  data: GenerateActivationCodesResult;
}

@ApiTags('activation-codes')
@Controller('activation-codes')
export class ActivationCodesController {
  constructor(
    private readonly activationCodesService: ActivationCodesService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate activation codes' })
  @ApiCreatedResponse({ description: 'Activation codes generated' })
  async generate(
    @Req() request: Request,
    @Body() generateActivationCodesDto: GenerateActivationCodesDto,
  ): Promise<GenerateActivationCodesResponse> {
    const result = await this.activationCodesService.generateActivationCodes(
      request.headers.authorization,
      generateActivationCodesDto,
    );

    return { data: result };
  }
}
