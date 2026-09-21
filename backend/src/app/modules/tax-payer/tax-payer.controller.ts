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
import { AuthGuard, AuthUser, Roles, RolesGuard } from 'src/core/security';
import { UserRole } from 'src/core/enums/user-role';
import { PageRequest } from 'src/core/utils/pagination.entity';
import { HeaderUtil } from 'src/core/utils/header-util';
import type { Request } from 'src/core/utils/request';
import { UserDTO } from 'src/app/modules/user/dtos/user.dto';
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

@Controller('api/vendors/:vendorId/tax-payers')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiTags('tax-payers-module')
@ApiExtraModels(
  TaxPayerDTO,
  CreateTaxPayerDTO,
  UpdateTaxPayerDTO,
  TaxPayerQueryDTO,
)
export class TaxPayerController {
  logger = new Logger('TaxPayerController');

  constructor(private readonly taxPayerService: TaxPayerService) {}

  @Get('/')
  @ApiOperation({ summary: 'Get the list of tax payers paginated' })
  @ApiParam({ name: 'vendorId' })
  @ApiResponse({
    status: 200,
    description: 'List all tax payers',
    type: TaxPayerDTO,
    isArray: true,
  })
  async getAll(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Req() req: Request,
    @Query() query: TaxPayerQueryDTO,
  ): Promise<Partial<TaxPayerDTO>[]> {
    const pageRequest = new PageRequest(
      +(query.page ?? 1),
      +(query.pageSize ?? 10),
      query.sortField ? `${query.sortField},${query.sortOrder || 'ASC'}` : '',
    );

    const [results, count] = await this.taxPayerService.findAndCount(
      vendorId,
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

  @Get('/:id')
  @ApiOperation({ summary: 'Get tax payer by id' })
  @ApiParam({ name: 'vendorId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({
    status: 200,
    description: 'Tax payer found',
    type: TaxPayerDTO,
  })
  @ApiResponse({ status: 404, description: 'Tax payer not found' })
  async getById(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Partial<TaxPayerDTO>> {
    const taxPayer = await this.taxPayerService.findOneOrFail(vendorId, id);
    return mapTaxPayerToDtoSelective(taxPayer);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create tax payer identity' })
  @ApiParam({ name: 'vendorId' })
  @ApiBody({ type: CreateTaxPayerDTO })
  @ApiResponse({
    status: 201,
    description: 'Tax payer created',
    type: TaxPayerDTO,
  })
  async create(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Body() createTaxPayerDTO: CreateTaxPayerDTO,
    @AuthUser() user: UserDTO,
  ): Promise<Partial<TaxPayerDTO>> {
    const mapped = mapCreateTaxPayerDtoToEntity(createTaxPayerDTO, vendorId);
    const saved = await this.taxPayerService.save(mapped, user?.email);
    return mapTaxPayerToDtoSelective(saved);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update tax payer identity' })
  @ApiParam({ name: 'vendorId' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateTaxPayerDTO })
  @ApiResponse({
    status: 200,
    description: 'Tax payer updated',
    type: TaxPayerDTO,
  })
  @ApiResponse({ status: 404, description: 'Tax payer not found' })
  async update(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() taxPayerDTO: UpdateTaxPayerDTO,
    @AuthUser() user: UserDTO,
  ): Promise<Partial<TaxPayerDTO>> {
    const existing = await this.taxPayerService.findOneOrFail(vendorId, id);
    const mapped = mapUpdateTaxPayerDtoToEntity(taxPayerDTO, existing);
    mapped.id = id;
    const updated = await this.taxPayerService.update(mapped, user?.email);
    return mapTaxPayerToDtoSelective(updated);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete tax payer' })
  @ApiParam({ name: 'vendorId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Tax payer deleted' })
  @ApiResponse({ status: 404, description: 'Tax payer not found' })
  async delete(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: UserDTO,
  ): Promise<void> {
    const existing = await this.taxPayerService.findOneOrFail(vendorId, id);
    await this.taxPayerService.delete(existing, user?.email);
  }
}
