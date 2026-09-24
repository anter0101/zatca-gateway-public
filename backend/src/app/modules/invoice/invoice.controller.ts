import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiKeyOrJwtGuard,
  RequestApiKey,
  RequestVendor,
} from 'src/core/security';
import { SoftwareVendor } from 'src/app/modules/vendor/software-vendor.entity';
import { ApiKey } from 'src/app/modules/api-key/api-key.entity';
import {
  requireApiKeyVendor,
  requireTaxPayerKey,
} from 'src/app/modules/tax-payer/require-api-key-vendor';
import { InvoiceStatus } from 'src/core/enums/invoice-status';
import { InvoiceSubtype } from 'src/core/enums/invoice-subtype';
import { InvoiceService } from './invoice.service';
import { invoiceOptions } from './invoice-choices';
import { CreateInvoiceDTO, InvoiceViewDTO } from './dtos/invoice.dto';

@Controller('v1/invoices')
@ApiBearerAuth('bearer')
@UseGuards(ApiKeyOrJwtGuard)
@ApiTags('invoices')
export class InvoiceController {
  constructor(private readonly invoices: InvoiceService) {}

  @Get('/options')
  @ApiOperation({
    summary: 'Choice lists for invoice forms (subtype, type, tax, payment, reasons)',
  })
  @ApiResponse({ status: 200 })
  options(@RequestVendor() vendor: SoftwareVendor | null) {
    requireApiKeyVendor(vendor);
    return invoiceOptions();
  }

  @Post('/')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue a live invoice for sign and clearance or reporting' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiBody({ type: CreateInvoiceDTO })
  @ApiResponse({ status: 202, type: InvoiceViewDTO })
  create(
    @RequestVendor() vendor: SoftwareVendor | null,
    @RequestApiKey() apiKey: ApiKey | null,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() body: CreateInvoiceDTO,
  ): Promise<InvoiceViewDTO> {
    const owner = requireApiKeyVendor(vendor);
    const taxPayerId = requireTaxPayerKey(apiKey);
    return this.invoices.create(owner.id, taxPayerId, body, idempotencyKey, apiKey);
  }

  @Get('/')
  @ApiOperation({ summary: 'List invoices for the tax payer on this API key' })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiQuery({ name: 'subtype', required: false, enum: InvoiceSubtype })
  list(
    @RequestVendor() vendor: SoftwareVendor | null,
    @RequestApiKey() apiKey: ApiKey | null,
    @Query('status') status?: InvoiceStatus,
    @Query('subtype') subtype?: InvoiceSubtype,
  ): Promise<InvoiceViewDTO[]> {
    const owner = requireApiKeyVendor(vendor);
    const taxPayerId = requireTaxPayerKey(apiKey);
    return this.invoices.list(owner.id, taxPayerId, { status, subtype });
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Invoice status, hash, QR, and ZATCA error' })
  @ApiResponse({ status: 200, type: InvoiceViewDTO })
  getOne(
    @RequestVendor() vendor: SoftwareVendor | null,
    @RequestApiKey() apiKey: ApiKey | null,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InvoiceViewDTO> {
    const owner = requireApiKeyVendor(vendor);
    const taxPayerId = requireTaxPayerKey(apiKey);
    return this.invoices.getOne(owner.id, taxPayerId, id);
  }
}
