import { Body, Controller, Logger, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthLoginDTO } from './dto/auth-login.dto';
import { UserService } from '../user/user.service';

@Controller('api/auth')
export class AuthController {
  logger = new Logger('AuthController');

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('/login')
  async authorize(
    @Body() userDTO: AuthLoginDTO,
    @Res() res: Response,
  ): Promise<void> {
    const jwt = await this.authService.login(userDTO);
    const user = await this.userService.findByFields({
      where: {
        email: userDTO.email,
      },
    });
    res.json({
      user,
      token: jwt.access_token,
    });
  }
}
