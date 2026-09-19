import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UpdateUserDTO } from 'src/app/modules/user/dtos/update-user.dto';

export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: UpdateUserDTO }>();
    return request.user;
  },
);
