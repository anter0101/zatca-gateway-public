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
import { VendorService } from './vendor.service';
import { VendorDTO } from './dtos/vendor.dto';
import { CreateVendorDTO } from './dtos/create-vendor.dto';
import { UpdateVendorDTO } from './dtos/update-vendor.dto';
import { VendorQueryDTO } from './dtos/vendor-query.dto';
import {
  mapCreateVendorDtoToEntity,
  mapUpdateVendorDtoToEntity,
  mapVendorToDtoSelective,
} from './vendor.mapper';

@Controller('api/vendors')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiTags('vendors-module')
@ApiExtraModels(VendorDTO, CreateVendorDTO, UpdateVendorDTO, VendorQueryDTO)
export class VendorController {
  logger = new Logger('VendorController');

  constructor(private readonly vendorService: VendorService) {}

  @Get('/')
  @ApiOperation({ summary: 'Get the list of vendors paginated' })
  @ApiResponse({
    status: 200,
    description: 'List all vendors',
    type: VendorDTO,
    isArray: true,
  })
  async getAll(
    @Req() req: Request,
    @Query() query: VendorQueryDTO,
  ): Promise<Partial<VendorDTO>[]> {
    const pageRequest = new PageRequest(
      +(query.page ?? 1),
      +(query.pageSize ?? 10),
      query.sortField ? `${query.sortField},${query.sortOrder || 'ASC'}` : '',
    );

    const [results, count] = await this.vendorService.findAndCount({
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

    return mapVendorToDtoSelective(results);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get vendor by id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Vendor found', type: VendorDTO })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Partial<VendorDTO>> {
    const vendor = await this.vendorService.findByIdOrFail(id);
    return mapVendorToDtoSelective(vendor);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a software vendor' })
  @ApiBody({ type: CreateVendorDTO })
  @ApiResponse({ status: 201, description: 'Vendor created', type: VendorDTO })
  async create(
    @Body() createVendorDTO: CreateVendorDTO,
    @AuthUser() user: UserDTO,
  ): Promise<Partial<VendorDTO>> {
    const mapped = mapCreateVendorDtoToEntity(createVendorDTO);
    const saved = await this.vendorService.save(mapped, user?.email);
    return mapVendorToDtoSelective(saved);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update a vendor' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateVendorDTO })
  @ApiResponse({ status: 200, description: 'Vendor updated', type: VendorDTO })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() vendorDTO: UpdateVendorDTO,
    @AuthUser() user: UserDTO,
  ): Promise<Partial<VendorDTO>> {
    const existing = await this.vendorService.findByIdOrFail(id);
    const mapped = mapUpdateVendorDtoToEntity(vendorDTO, existing);
    mapped.id = id;
    const updated = await this.vendorService.update(mapped, user?.email);
    return mapVendorToDtoSelective(updated);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a vendor' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Vendor deleted' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: UserDTO,
  ): Promise<void> {
    const existing = await this.vendorService.findByIdOrFail(id);
    await this.vendorService.delete(existing, user?.email);
  }
}
