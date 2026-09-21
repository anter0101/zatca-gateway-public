import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class StartOnboardDTO {
  @ApiProperty({ example: '123456', description: 'OTP from Fatoora portal' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  otp: string;
}

export class OnboardProgressDTO {
  @ApiProperty()
  taxPayerId: number;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional({ nullable: true })
  step: string | null;

  @ApiProperty()
  progress: number;

  @ApiProperty()
  complianceDone: number;

  @ApiProperty()
  complianceTotal: number;

  @ApiPropertyOptional({ nullable: true })
  error: string | null;
}

export class CsrCreatedDTO {
  @ApiProperty()
  taxPayerId: number;

  @ApiProperty({ example: 'csr_created' })
  status: string;

  @ApiProperty({ description: 'CSR PEM (register in Fatoora portal)' })
  csr: string;

  @ApiProperty()
  commonName: string;

  @ApiProperty()
  serialNumber: string;
}
