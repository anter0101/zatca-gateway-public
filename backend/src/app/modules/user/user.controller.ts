import {
  Controller,
  Get,
  Logger,
  Query,
  Req,
  UseGuards,
  Post,
  Put,
  Delete,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, Roles, RolesGuard, AuthUser } from 'src/core/security';
import { UserDTO } from './dtos/user.dto';
import { UserRole } from 'src/core/enums/user-role';
import { PageRequest } from 'src/core/utils/pagination.entity';
import { HeaderUtil } from 'src/core/utils/header-util';
import type { Request } from 'src/core/utils/request';
import { mapUserToUserDtoSelective } from './user.mapper';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { User } from './user.entity';
import { UserQueryDTO } from './dtos/user-query.dto';

@Controller('api/users')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiTags('users-module')
export class UserController {
  logger = new Logger('UsersController');

  constructor(private readonly userService: UserService) {}

  @Get('/')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get the list of users paginated' })
  @ApiResponse({
    status: 200,
    description: 'List all users',
    type: UserDTO,
    isArray: true,
  })
  async getAllUsers(
    @Req() req: Request,
    @Query() query: UserQueryDTO,
  ): Promise<UpdateUserDTO[]> {
    const pageRequest: PageRequest = new PageRequest(
      +(query.page ?? 1),
      +(query.pageSize ?? 10),
      query.sortField ? `${query.sortField},${query.sortOrder || 'ASC'}` : '',
    );

    const [results, count] = await this.userService.findAndCount({
      skip: +pageRequest.page * pageRequest.size,
      take: +pageRequest.size,
      order: pageRequest.sort.asOrder(),
    });

    const userDtos = mapUserToUserDtoSelective(results);

    HeaderUtil.addPaginationHeaders(
      req.res!,
      count,
      pageRequest.page,
      count > pageRequest.page * pageRequest.size,
    );

    return userDtos;
  }

  @Post('/')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: UserDTO,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(
    @Body() userDTO: UserDTO,
    @AuthUser() user: User,
  ): Promise<UserDTO> {
    const existing = await this.userService.findByFields({
      where: { email: userDTO.email },
    });
    if (existing) {
      throw new BadRequestException(
        `User with email ${userDTO.email} already exists`,
      );
    }
    const created = await this.userService.save(userDTO, user?.email, true);
    return created;
  }

  @Put('/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully updated.',
    type: UserDTO,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async update(
    @Param('id') id: number,
    @Body() userDTO: UpdateUserDTO,
    @AuthUser() user: User,
  ): Promise<UpdateUserDTO> {
    const existing = await this.userService.findById(id);
    if (!existing) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    const existingEmail = await this.userService.findByFields({
      where: { email: userDTO.email },
    });

    if (existingEmail && existingEmail.id !== Number(id)) {
      throw new BadRequestException(
        `User with email ${userDTO.email} already exists`,
      );
    }
    userDTO.id = id;
    const updated = await this.userService.update(userDTO, user?.email);
    return updated;
  }

  @Delete('/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async delete(@Param('id') id: number): Promise<void> {
    const existing = await this.userService.findById(id);
    if (!existing) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    await this.userService.delete(existing);
  }
}
