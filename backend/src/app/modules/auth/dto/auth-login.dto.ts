import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * A DTO representing a login user.
 */
export class AuthLoginDTO {
  @ApiProperty({ description: 'User email' })
  @IsString()
  readonly email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  readonly password: string;

  @ApiProperty({ description: 'User remember login', required: false })
  readonly rememberMe?: number;
}
