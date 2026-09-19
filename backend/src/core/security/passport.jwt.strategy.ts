import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthService } from 'src/app/modules/auth/auth.service';
import { ConfigService } from '@nestjs/config';

// const logger: Logger = new Logger('Main');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('APP_SECRET_KEY'),
      // secretOrKey: 'X24aQj8aG6H2rB7HR4SZ6QFtY5ST3vwS',
      passReqToCallback: true,
    });
  }

  public async validate(request: Request, payload: JwtPayload) {
    // logger.debug('request from security: ', request);
    // logger.debug('payload security s: ', payload);
    const user = await this.authService.validateUser(payload);
    if (!user) {
      new UnauthorizedException({ message: 'user does not exist' });
    }
    return user;
  }
}
