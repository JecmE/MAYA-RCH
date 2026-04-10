import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'may_a_rch_secret',
    });
  }

  async validate(payload: any) {
    if (!payload.usuarioId) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      usuarioId: payload.usuarioId,
      empleadoId: payload.empleadoId,
      username: payload.username,
      roles: payload.roles,
    };
  }
}
