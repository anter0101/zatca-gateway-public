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
  AuthUser,
  RequestApiKey,
  RequestVendor,
  RequestZatcaEnv,
} from 'src/core/security';
import { UserDTO } from 'src/app/modules/user/dtos/user.dto';
import { SoftwareVendor } from 'src/app/modules/vendor/software-vendor.entity';
import { ApiKey } from 'src/app/modules/api-key/api-key.entity';
import { ZatcaEnvironment } from 'src/core/enums/zatca-environment';
import { OnboardService } from './onboard.service';
import {
  CsrCreatedDTO,
  OnboardProgressDTO,
  StartOnboardDTO,
} from './dtos/onboard.dto';

@Controller('v1/taxpayers')
@ApiBearerAuth('bearer')
@UseGuards(ApiKeyOrJwtGuard)
@ApiTags('onboard-module')
@ApiExtraModels(CsrCreatedDTO, OnboardProgressDTO, StartOnboardDTO)
export class OnboardController {
  logger = new Logger('OnboardController');

  constructor(private readonly onboardService: OnboardService) {}

  @Post('/:id/onboard/csr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate CSR for tax payer (sync)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: CsrCreatedDTO })
  async createCsr(
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: UserDTO | null,
    @RequestVendor() vendor: SoftwareVendor | null,
    @RequestApiKey() apiKey: ApiKey | null,
    @RequestZatcaEnv() zatcaEnv: ZatcaEnvironment | null,
  ): Promise<CsrCreatedDTO> {
    return this.onboardService.createCsr(id, {
      vendor,
      apiKey,
      userRole: user?.role,
      zatcaEnv,
    });
  }

  @Post('/:id/onboard')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start onboard worker with OTP' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: StartOnboardDTO })
  @ApiResponse({ status: 202, type: OnboardProgressDTO })
  async startOnboard(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: StartOnboardDTO,
    @AuthUser() user: UserDTO | null,
    @RequestVendor() vendor: SoftwareVendor | null,
    @RequestApiKey() apiKey: ApiKey | null,
    @RequestZatcaEnv() zatcaEnv: ZatcaEnvironment | null,
  ): Promise<OnboardProgressDTO> {
    return this.onboardService.startOnboard(id, body.otp, {
      vendor,
      apiKey,
      userRole: user?.role,
      zatcaEnv,
    });
  }

  @Get('/:id/onboard')
  @ApiOperation({ summary: 'Poll onboard progress' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: OnboardProgressDTO })
  async getProgress(
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: UserDTO | null,
    @RequestVendor() vendor: SoftwareVendor | null,
  ): Promise<OnboardProgressDTO> {
    return this.onboardService.getProgress(id, {
      vendor,
      userRole: user?.role,
    });
  }

  @Post('/:id/renew')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Renew production CSID (async)' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: StartOnboardDTO })
  @ApiResponse({ status: 202, type: OnboardProgressDTO })
  async renew(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: StartOnboardDTO,
    @AuthUser() user: UserDTO | null,
    @RequestVendor() vendor: SoftwareVendor | null,
    @RequestApiKey() apiKey: ApiKey | null,
    @RequestZatcaEnv() zatcaEnv: ZatcaEnvironment | null,
  ): Promise<OnboardProgressDTO> {
    return this.onboardService.startRenew(id, body.otp, {
      vendor,
      apiKey,
      userRole: user?.role,
      zatcaEnv,
    });
  }
}
