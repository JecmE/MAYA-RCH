import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../../entities/usuario.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {
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

    // VERIFICACIÓN DE SESIÓN ACTIVA (session_version)
    const user = await this.usuarioRepository.findOne({
      where: { usuarioId: payload.usuarioId },
    });

    if (!user || user.estado !== 'activo' || user.sessionVersion !== payload.sessionVersion) {
      throw new UnauthorizedException('La sesión ha expirado o la cuenta fue invalidada.');
    }

    return {
      usuarioId: payload.usuarioId,
      empleadoId: payload.empleadoId,
      username: payload.username,
      roles: payload.roles,
    };
  }
}
