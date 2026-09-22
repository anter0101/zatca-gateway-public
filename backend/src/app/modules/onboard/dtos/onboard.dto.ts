import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { OnboardStatus } from 'src/core/enums/onboard-status';
import { OnboardStep } from 'src/core/enums/onboard-step';

export class StartOnboardDTO {
  @ApiProperty({ example: '123456', description: 'OTP from Fatoora portal' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  otp!: string;
}

export class OnboardProgressDTO {
  @ApiProperty()
  taxPayerId!: number;

  @ApiProperty({ enum: OnboardStatus, example: OnboardStatus.RUNNING })
  @IsEnum(OnboardStatus)
  status!: OnboardStatus;

  @ApiPropertyOptional({
    enum: OnboardStep,
    nullable: true,
    example: OnboardStep.COMPLIANCE,
  })
  @IsOptional()
  @IsEnum(OnboardStep)
  step!: OnboardStep | null;

  @ApiProperty()
  progress!: number;

  @ApiProperty()
  complianceDone!: number;

  @ApiProperty()
  complianceTotal!: number;

  @ApiPropertyOptional({ nullable: true })
  error!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Raw Fatoora/ZATCA error response body when available',
  })
  zatcaBody: unknown | null;
}

export class CsrCreatedDTO {
  @ApiProperty()
  taxPayerId!: number;

  @ApiProperty({
    enum: OnboardStatus,
    example: OnboardStatus.CSR_CREATED,
  })
  @IsEnum(OnboardStatus)
  status!: OnboardStatus;

  @ApiProperty({ description: 'CSR PEM (register in Fatoora portal)' })
  csr!: string;

  @ApiProperty()
  commonName!: string;

  @ApiProperty()
  serialNumber!: string;
}
