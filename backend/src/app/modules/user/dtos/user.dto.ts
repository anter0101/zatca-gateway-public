import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { Exclude } from 'class-transformer';
import { BaseDTO } from 'src/core/utils/base.dto';
import { UserRole } from 'src/core/enums/user-role';

/**
 * An User DTO object.
 */
export class UserDTO extends BaseDTO {
  @ApiProperty({
    uniqueItems: true,
    required: true,
    example: 'email@domain.com',
    description: 'User Email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456789', description: 'User password' })
  @Exclude()
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'Username',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiProperty({
    example: 1,
    description: 'User activation',
    required: false,
  })
  activated?: boolean;

  @ApiProperty({
    example: 'http://my-image-url',
    description: 'Image url',
    required: false,
  })
  imageUrl?: string;

  @ApiProperty({
    enum: UserRole,
    description: 'User Role',
    required: true,
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
