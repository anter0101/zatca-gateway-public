import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, AuthUser, Roles, RolesGuard } from 'src/core/security';
import { UserRole } from 'src/core/enums/user-role';
import { PageRequest } from 'src/core/utils/pagination.entity';
import { HeaderUtil } from 'src/core/utils/header-util';
import type { Request } from 'src/core/utils/request';
import { UserDTO } from 'src/app/modules/user/dtos/user.dto';
import { ApiKeyService } from './api-key.service';
import { ApiKeyDTO } from './dtos/api-key.dto';
import { CreateApiKeyDTO } from './dtos/create-api-key.dto';
import { UpdateApiKeyDTO } from './dtos/update-api-key.dto';
import { ApiKeyQueryDTO } from './dtos/api-key-query.dto';
import { mapApiKeyToDtoSelective } from './api-key.mapper';

@Controller('api/vendors/:vendorId/api-keys')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiTags('api-keys-module')
@ApiExtraModels(ApiKeyDTO, CreateApiKeyDTO, UpdateApiKeyDTO, ApiKeyQueryDTO)
export class ApiKeyController {
  logger = new Logger('ApiKeyController');

  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get('/')
  @ApiOperation({ summary: 'List API keys (metadata only)' })
  @ApiParam({ name: 'vendorId' })
  @ApiResponse({
    status: 200,
    description: 'List API keys',
    type: ApiKeyDTO,
    isArray: true,
  })
  async getAll(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Req() req: Request,
    @Query() query: ApiKeyQueryDTO,
  ): Promise<Partial<ApiKeyDTO>[]> {
    const pageRequest = new PageRequest(
      +(query.page ?? 1),
      +(query.pageSize ?? 10),
      query.sortField ? `${query.sortField},${query.sortOrder || 'ASC'}` : '',
    );

    const [results, count] = await this.apiKeyService.findAndCount(vendorId, {
      skip: +pageRequest.page * pageRequest.size,
      take: +pageRequest.size,
      order: pageRequest.sort.asOrder(),
    });

    HeaderUtil.addPaginationHeaders(
      req.res!,
      count,
      pageRequest.page,
      count > pageRequest.page * pageRequest.size,
    );

    return mapApiKeyToDtoSelective(results);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate API key (plaintext shown once)' })
  @ApiParam({ name: 'vendorId' })
  @ApiBody({ type: CreateApiKeyDTO })
  @ApiResponse({ status: 201, description: 'API key created', type: ApiKeyDTO })
  async create(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Body() createApiKeyDTO: CreateApiKeyDTO,
    @AuthUser() user: UserDTO,
  ): Promise<Partial<ApiKeyDTO>> {
    const { entity, plaintext } = await this.apiKeyService.save(
      vendorId,
      createApiKeyDTO,
      user?.email,
    );
    const dto = mapApiKeyToDtoSelective(entity);
    dto.key = plaintext;
    return dto;
  }

  @Post('/:keyId/revoke')
  @ApiOperation({ summary: 'Revoke API key (idempotent)' })
  @ApiParam({ name: 'vendorId' })
  @ApiParam({ name: 'keyId' })
  @ApiResponse({ status: 200, description: 'API key revoked', type: ApiKeyDTO })
  async revoke(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Param('keyId', ParseIntPipe) keyId: number,
    @AuthUser() user: UserDTO,
  ): Promise<Partial<ApiKeyDTO>> {
    const key = await this.apiKeyService.revoke(
      vendorId,
      keyId,
      user?.email,
    );
    return mapApiKeyToDtoSelective(key);
  }
}
