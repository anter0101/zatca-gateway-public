import { Request as ExpressRequest } from 'express';
import { UserDTO } from 'src/app/modules/user/dtos/user.dto';

export interface Request extends ExpressRequest {
  user?: UserDTO;
}
