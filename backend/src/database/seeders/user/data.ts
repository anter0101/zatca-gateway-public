import { UserDTO } from 'src/app/modules/user/dtos/user.dto';
import { UserRole } from 'src/core/enums/user-role';

export const users: UserDTO[] = [
  {
    id: 1,
    email: 'admin@admin.com',
    password: '12345',
    username: 'Administrator',
    role: UserRole.ADMIN,
    activated: true,
    createdBy: 'system',
  },
];
