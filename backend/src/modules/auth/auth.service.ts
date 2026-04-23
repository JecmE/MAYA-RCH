import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../entities/usuario.entity';
import { Empleado } from '../../entities/empleado.entity';
import { Rol } from '../../entities/rol.entity';
import { ResetPasswordToken } from '../../entities/reset-password-token.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
    @InjectRepository(ResetPasswordToken)
    private resetTokenRepository: Repository<ResetPasswordToken>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  private sanitizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str
      .replace(/\?/g, (match, offset, original) => {
        if (original.includes('Tecnolog')) return 'í';
        if (original.includes('Garc')) return 'í';
        if (original.includes('Rodr')) return 'í';
        if (original.includes('Mart')) return 'í';
        return 'í';
      })
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã±/g, 'ñ');
  }

  async login(loginDto: LoginDto, ip: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { username: loginDto.username },
      relations: ['roles', 'empleado'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (usuario.estado !== 'activo') {
      throw new UnauthorizedException('La cuenta está bloqueada o inactiva');
    }

    const isMatch = await bcrypt.compare(loginDto.password, usuario.passwordHash);
    if (!isMatch) {
      // Registrar intento fallido si fuera necesario
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      usuarioId: usuario.usuarioId,
      username: usuario.username,
      empleadoId: usuario.empleadoId,
      roles: usuario.roles.map((r) => r.nombre),
    };

    usuario.ultimoLogin = new Date();
    await this.usuarioRepository.save(usuario);

    const auditLog = this.auditRepository.create({
      usuarioId: usuario.usuarioId,
      fechaHora: new Date(),
      modulo: 'AUTH',
      accion: 'LOGIN',
      entidad: 'USUARIO',
      entidadId: usuario.usuarioId,
      detalle: `Inicio de sesión exitoso desde IP: ${ip}`,
    });
    await this.auditRepository.save(auditLog);

    return {
      token: this.jwtService.sign(payload),
      user: {
        usuarioId: usuario.usuarioId,
        username: usuario.username,
        roles: usuario.roles.map((r) => r.nombre),
        empleadoId: usuario.empleadoId,
        nombreCompleto: this.sanitizeString(
          usuario.empleado ? `${usuario.empleado.nombres} ${usuario.empleado.apellidos}` : '',
        ),
        email: usuario.empleado?.email,
      },
    };
  }

  async logout(usuarioId: number) {
    const auditLog = this.auditRepository.create({
      usuarioId,
      fechaHora: new Date(),
      modulo: 'AUTH',
      accion: 'LOGOUT',
      entidad: 'USUARIO',
      entidadId: usuarioId,
      detalle: 'Cierre de sesión',
    });
    await this.auditRepository.save(auditLog);
    return { message: 'Cierre de sesión exitoso' };
  }

  async forgotPassword(email: string, ip: string, userAgent: string) {
    const empleado = await this.empleadoRepository.findOne({ where: { email } });
    if (!empleado) {
      // No revelar si el correo existe o no por seguridad, pero en este caso retornamos ok
      return { message: 'Si el correo existe, se enviará un enlace de recuperación' };
    }

    const usuario = await this.usuarioRepository.findOne({ where: { empleadoId: empleado.empleadoId } });
    if (!usuario) return { message: 'Si el correo existe, se enviará un enlace de recuperación' };

    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hora de vigencia

    const resetToken = this.resetTokenRepository.create({
      usuarioId: usuario.usuarioId,
      tokenHash: await bcrypt.hash(token, 10),
      fechaExpira: expires,
      ipSolicitud: ip,
      userAgent,
    });

    await this.resetTokenRepository.save(resetToken);

    // Aquí iría el envío de correo real
    console.log(`Token de recuperación para ${email}: ${token}`);

    return { message: 'Se ha enviado un enlace de recuperación a su correo' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Esta es una implementación simplificada para fines de demo
    // En una real, buscaríamos por el token (que no debería ser hash en BD para búsqueda directa)
    // o el usuario enviaría su ID + token.
    throw new BadRequestException('Funcionalidad en desarrollo');
  }

  async getProfile(usuarioId: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuarioId },
      relations: ['roles', 'empleado'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const roles = usuario.roles?.length ? usuario.roles.map((r: Rol) => r.nombre) : [];

    return {
      usuarioId: usuario.usuarioId,
      username: usuario.username,
      empleadoId: usuario.empleadoId,
      nombreCompleto: this.sanitizeString(
        usuario.empleado ? `${usuario.empleado.nombres} ${usuario.empleado.apellidos}` : '',
      ),
      email: usuario.empleado?.email,
      roles,
      ultimoLogin: usuario.ultimoLogin,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usuarioRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new BadRequestException('El nombre de usuario ya existe');
    }

    const existingEmpleado = await this.empleadoRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingEmpleado) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const empleado = this.empleadoRepository.create({
      codigoEmpleado: registerDto.codigoEmpleado,
      nombres: registerDto.nombres,
      apellidos: registerDto.apellidos,
      email: registerDto.email,
      telefono: registerDto.telefono,
      fechaIngreso: new Date(),
      puesto: registerDto.puesto,
      activo: true,
    });

    const savedEmpleado = await this.empleadoRepository.save(empleado);

    const defaultRole = await this.rolRepository.findOne({ where: { nombre: 'Empleado' } });

    const usuario = this.usuarioRepository.create({
      empleadoId: savedEmpleado.empleadoId,
      username: registerDto.username,
      passwordHash: await bcrypt.hash(registerDto.password, 10),
      estado: 'activo',
      roles: defaultRole ? [defaultRole] : [],
    });

    const savedUsuario = await this.usuarioRepository.save(usuario);

    return {
      message: 'Registro exitoso',
      usuarioId: savedUsuario.usuarioId,
      empleadoId: savedEmpleado.empleadoId,
    };
  }
}
