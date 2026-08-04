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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SearchLegacyUsersDto } from './dto/search-legacy-users.dto';
import { LegacyUserSearchService } from './legacy-user-search.service';
import { SearchLegacyUsersResult } from './legacy.types';

interface SearchLegacyUsersResponse {
  data: SearchLegacyUsersResult;
}

@ApiTags('legacy-users')
@Controller('legacy-users')
export class LegacyUsersController {
  constructor(
    private readonly legacyUserSearchService: LegacyUserSearchService,
  ) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search legacy users by display name' })
  @ApiOkResponse({ description: 'Legacy user search results' })
  async search(
    @Req() request: Request,
    @Body() searchLegacyUsersDto: SearchLegacyUsersDto,
  ): Promise<SearchLegacyUsersResponse> {
    const result = await this.legacyUserSearchService.searchByDisplayName(
      request.headers.authorization,
      searchLegacyUsersDto.displayName,
    );

    return { data: result };
  }
}
