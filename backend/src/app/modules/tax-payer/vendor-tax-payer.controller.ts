import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import {
  ApiKeyOrJwtGuard,
  RequestApiKey,
  RequestVendor,
  RequestZatcaEnv,
} from 'src/core/security';
import { PageRequest } from 'src/core/utils/pagination.entity';
import { HeaderUtil } from 'src/core/utils/header-util';
import type { Request } from 'src/core/utils/request';
import { SoftwareVendor } from 'src/app/modules/vendor/software-vendor.entity';
import { ZatcaEnvironment } from 'src/core/enums/zatca-environment';
import { TaxPayerService } from './tax-payer.service';
import { TaxPayerDTO } from './dtos/tax-payer.dto';
import { CreateTaxPayerDTO } from './dtos/create-tax-payer.dto';
import { UpdateTaxPayerDTO } from './dtos/update-tax-payer.dto';
import { TaxPayerQueryDTO } from './dtos/tax-payer-query.dto';
import {
  mapCreateTaxPayerDtoToEntity,
  mapTaxPayerToDtoSelective,
  mapUpdateTaxPayerDtoToEntity,
} from './tax-payer.mapper';
import { ApiKey } from 'src/app/modules/api-key/api-key.entity';
import { ApiKeyService } from 'src/app/modules/api-key/api-key.service';
import { CreateApiKeyDTO } from 'src/app/modules/api-key/dtos/create-api-key.dto';
import { ApiKeyDTO } from 'src/app/modules/api-key/dtos/api-key.dto';
import { mapApiKeyToDtoSelective } from 'src/app/modules/api-key/api-key.mapper';
import {
  requireApiKeyVendor,
  requireVendorWideKey,
} from './require-api-key-vendor';

@Controller('v1/taxpayers')
@ApiBearerAuth('bearer')
@UseGuards(ApiKeyOrJwtGuard)
@ApiTags('vendor-tax-payers')
@ApiExtraModels(TaxPayerDTO, CreateTaxPayerDTO, UpdateTaxPayerDTO)
export class VendorTaxPayerController {
  logger = new Logger('VendorTaxPayerController');

  constructor(
    private readonly taxPayerService: TaxPayerService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  @Get('/')
  @ApiOperation({
    summary: 'List this vendor tax payers (API key; no vendor id)',
  })
  @ApiResponse({ status: 200, type: TaxPayerDTO, isArray: true })
  async getAll(
    @RequestVendor() vendor: SoftwareVendor | null,
    @Req() req: Request,
    @Query() query: TaxPayerQueryDTO,
  ): Promise<Partial<TaxPayerDTO>[]> {
    const owner = requireApiKeyVendor(vendor);
    const pageRequest = new PageRequest(
      +(query.page ?? 1),
      +(query.pageSize ?? 10),
      query.sortField ? `${query.sortField},${query.sortOrder || 'ASC'}` : '',
    );

    const [results, count] = await this.taxPayerService.findAndCount(
      owner.id,
      {
        skip: +pageRequest.page * pageRequest.size,
        take: +pageRequest.size,
        order: pageRequest.sort.asOrder(),
      },
    );

    HeaderUtil.addPaginationHeaders(
      req.res!,
      count,
      pageRequest.page,
      count > pageRequest.page * pageRequest.size,
    );

    return mapTaxPayerToDtoSelective(results);
  }

  @Get('/:id/api-keys')
  @ApiOperation({ summary: 'List API keys issued for this tax payer' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: ApiKeyDTO, isArray: true })
  async listKeys(
    @RequestVendor() vendor: SoftwareVendor | null,
    @RequestApiKey() apiKey: ApiKey | null,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Partial<ApiKeyDTO>[]> {
    const owner = requireApiKeyVendor(vendor);
    requireVendorWideKey(apiKey);
    await this.taxPayerService.findOneOrFail(owner.id, id);
    const [results] = await this.apiKeyService.findAndCount(owner.id, {
      where: { taxPayerId: id },
      order: { id: 'DESC' },
    });
    return mapApiKeyToDtoSelective(results);
  }

  @Post('/:id/api-keys')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate an API key for this tax payer (plaintext shown once)',
  })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: CreateApiKeyDTO })
  @ApiResponse({ status: 201, type: ApiKeyDTO })
  async createKey(
    @RequestVendor() vendor: SoftwareVendor | null,
    @RequestApiKey() apiKey: ApiKey | null,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateApiKeyDTO,
  ): Promise<Partial<ApiKeyDTO>> {
    const owner = requireApiKeyVendor(vendor);
    requireVendorWideKey(apiKey);
    await this.taxPayerService.findOneOrFail(owner.id, id);
    const { entity, plaintext } = await this.apiKeyService.save(owner.id, {
      ...body,
      taxPayerId: id,
    });
    const dto = mapApiKeyToDtoSelective(entity);
    dto.key = plaintext;
    return dto;
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get a tax payer owned by this vendor' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: TaxPayerDTO })
  @ApiResponse({ status: 404, description: 'Tax payer not found' })
  async getById(
    @RequestVendor() vendor: SoftwareVendor | null,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Partial<TaxPayerDTO>> {
    const owner = requireApiKeyVendor(vendor);
    const taxPayer = await this.taxPayerService.findOneOrFail(owner.id, id);
    return mapTaxPayerToDtoSelective(taxPayer);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create tax payer for the API key vendor',
  })
  @ApiBody({ type: CreateTaxPayerDTO })
  @ApiResponse({ status: 201, type: TaxPayerDTO })
  async create(
    @RequestVendor() vendor: SoftwareVendor | null,
    @RequestZatcaEnv() zatcaEnv: ZatcaEnvironment | null,
    @Body() createTaxPayerDTO: CreateTaxPayerDTO,
  ): Promise<Partial<TaxPayerDTO>> {
    const owner = requireApiKeyVendor(vendor);
    const mapped = mapCreateTaxPayerDtoToEntity(
      createTaxPayerDTO,
      owner.id,
      zatcaEnv,
    );
    const saved = await this.taxPayerService.save(mapped);
    return mapTaxPayerToDtoSelective(saved);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update a tax payer owned by this vendor' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateTaxPayerDTO })
  @ApiResponse({ status: 200, type: TaxPayerDTO })
  @ApiResponse({ status: 404, description: 'Tax payer not found' })
  async update(
    @RequestVendor() vendor: SoftwareVendor | null,
    @Param('id', ParseIntPipe) id: number,
    @Body() taxPayerDTO: UpdateTaxPayerDTO,
  ): Promise<Partial<TaxPayerDTO>> {
    const owner = requireApiKeyVendor(vendor);
    const existing = await this.taxPayerService.findOneOrFail(owner.id, id);
    const mapped = mapUpdateTaxPayerDtoToEntity(taxPayerDTO, existing);
    mapped.id = id;
    const updated = await this.taxPayerService.update(mapped);
    return mapTaxPayerToDtoSelective(updated);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a tax payer owned by this vendor' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Tax payer deleted' })
  @ApiResponse({ status: 404, description: 'Tax payer not found' })
  async delete(
    @RequestVendor() vendor: SoftwareVendor | null,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const owner = requireApiKeyVendor(vendor);
    const existing = await this.taxPayerService.findOneOrFail(owner.id, id);
    await this.taxPayerService.delete(existing);
  }
}
