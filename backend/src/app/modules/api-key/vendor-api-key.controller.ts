import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiKeyOrJwtGuard,
  RequestApiKey,
  RequestVendor,
} from 'src/core/security';
import { PageRequest } from 'src/core/utils/pagination.entity';
import { HeaderUtil } from 'src/core/utils/header-util';
import type { Request } from 'src/core/utils/request';
import { SoftwareVendor } from 'src/app/modules/vendor/software-vendor.entity';
import { ApiKey } from './api-key.entity';
import {
  requireApiKeyVendor,
  requireVendorWideKey,
} from 'src/app/modules/tax-payer/require-api-key-vendor';
import { ApiKeyService } from './api-key.service';
import { ApiKeyDTO } from './dtos/api-key.dto';
import { CreateApiKeyDTO } from './dtos/create-api-key.dto';
import { ApiKeyQueryDTO } from './dtos/api-key-query.dto';
import { mapApiKeyToDtoSelective } from './api-key.mapper';

@Controller('v1/api-keys')
@ApiBearerAuth('bearer')
@UseGuards(ApiKeyOrJwtGuard)
@ApiTags('vendor-api-keys')
export class VendorApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get('/')
  @ApiOperation({ summary: 'List this vendor API keys' })
  @ApiResponse({ status: 200, type: ApiKeyDTO, isArray: true })
  async getAll(
    @RequestVendor() vendor: SoftwareVendor | null,
    @RequestApiKey() apiKey: ApiKey | null,
    @Req() req: Request,
    @Query() query: ApiKeyQueryDTO,
  ): Promise<Partial<ApiKeyDTO>[]> {
    const owner = requireApiKeyVendor(vendor);
    requireVendorWideKey(apiKey);
    const pageRequest = new PageRequest(
      +(query.page ?? 1),
      +(query.pageSize ?? 10),
      query.sortField ? `${query.sortField},${query.sortOrder || 'ASC'}` : '',
    );
    const [results, count] = await this.apiKeyService.findAndCount(owner.id, {
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
  @ApiOperation({
    summary: 'Generate an API key for this vendor (plaintext shown once)',
  })
  @ApiBody({ type: CreateApiKeyDTO })
  @ApiResponse({ status: 201, type: ApiKeyDTO })
  async create(
    @RequestVendor() vendor: SoftwareVendor | null,
    @RequestApiKey() apiKey: ApiKey | null,
    @Body() body: CreateApiKeyDTO,
  ): Promise<Partial<ApiKeyDTO>> {
    const owner = requireApiKeyVendor(vendor);
    requireVendorWideKey(apiKey);
    const { entity, plaintext } = await this.apiKeyService.save(owner.id, body);
    const dto = mapApiKeyToDtoSelective(entity);
    dto.key = plaintext;
    return dto;
  }

  @Post('/:keyId/revoke')
  @ApiOperation({ summary: 'Revoke one of this vendor API keys' })
  @ApiResponse({ status: 200, type: ApiKeyDTO })
  async revoke(
    @RequestVendor() vendor: SoftwareVendor | null,
    @RequestApiKey() apiKey: ApiKey | null,
    @Param('keyId', ParseIntPipe) keyId: number,
  ): Promise<Partial<ApiKeyDTO>> {
    const owner = requireApiKeyVendor(vendor);
    requireVendorWideKey(apiKey);
    const key = await this.apiKeyService.revoke(owner.id, keyId);
    return mapApiKeyToDtoSelective(key);
  }
}
