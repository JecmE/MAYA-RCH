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

    // Validamos:
    // 1. Que el usuario exista
    // 2. Que esté activo
    // 3. Que la versión de sesión del token coincida con la de la BD
    // (Usamos 0 por defecto si la versión es null para que la comparación sea válida)
    const dbVersion = user?.sessionVersion ?? 0;
    const tokenVersion = payload.sessionVersion ?? 0;

    if (!user || user.estado !== 'activo' || dbVersion !== tokenVersion) {
      console.log(`[AUTH] Bloqueando acceso a @${payload.username}: Sesión invalidada o cuenta bloqueada.`);
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
