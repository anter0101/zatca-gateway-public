import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/core/enums/user-role';

export const Roles = (...roles: UserRole[]): any => SetMetadata('roles', roles);
