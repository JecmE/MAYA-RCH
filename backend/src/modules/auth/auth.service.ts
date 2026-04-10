import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Usuario } from '../../entities/usuario.entity';
import { Empleado } from '../../entities/empleado.entity';
import { ResetPasswordToken } from '../../entities/reset-password-token.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Rol } from '../../entities/rol.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(ResetPasswordToken)
    private resetTokenRepository: Repository<ResetPasswordToken>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    private dataSource: DataSource,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto, ipAddress: string) {
    const { username, password } = loginDto;

    const usuario = await this.usuarioRepository.findOne({
      where: { username },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (usuario.estado !== 'activo') {
      throw new UnauthorizedException('Usuario bloqueado o inactivo');
    }

    const isPasswordValid = await bcrypt.compare(password, usuario.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    usuario.ultimoLogin = new Date();
    await this.usuarioRepository.save(usuario);

    const rolesResult = await this.dataSource.query(
      `SELECT r.nombre FROM ROL r 
       INNER JOIN USUARIO_ROL ur ON r.rol_id = ur.rol_id 
       WHERE ur.usuario_id = ${usuario.usuarioId}`,
    );

    const roles =
      rolesResult && rolesResult.length > 0 ? rolesResult.map((r: any) => r.nombre) : ['Empleado'];

    let nombreCompleto = '';
    let email = '';

    if (usuario.empleadoId) {
      const empleados = await this.dataSource.query(
        `SELECT TOP 1 nombres, apellidos, email FROM EMPLEADO WHERE empleado_id = ${usuario.empleadoId}`,
      );
      if (empleados && empleados.length > 0) {
        nombreCompleto = `${empleados[0].nombres} ${empleados[0].apellidos}`;
        email = empleados[0].email || '';
      }
    }

    const payload = {
      usuarioId: usuario.usuarioId,
      empleadoId: usuario.empleadoId,
      username: usuario.username,
      roles,
    };

    const token = this.jwtService.sign(payload);

    const auditLog = this.auditRepository.create({
      usuarioId: usuario.usuarioId,
      modulo: 'AUTH',
      accion: 'LOGIN',
      entidad: 'USUARIO',
      detalle: `Login exitoso desde ${ipAddress}`,
    });
    await this.auditRepository.save(auditLog);

    return {
      token,
      user: {
        usuarioId: usuario.usuarioId,
        username: usuario.username,
        empleadoId: usuario.empleadoId,
        nombreCompleto,
        email,
        roles,
      },
    };
  }

  async logout(usuarioId: number) {
    const auditLog = this.auditRepository.create({
      usuarioId,
      modulo: 'AUTH',
      accion: 'LOGOUT',
      entidad: 'USUARIO',
      detalle: 'Usuario cerró sesión',
    });
    await this.auditRepository.save(auditLog);

    return { message: 'Sesión cerrada correctamente' };
  }

  async forgotPassword(email: string, ipAddress: string, userAgent: string) {
    const empleado = await this.empleadoRepository.findOne({
      where: { email },
    });

    if (!empleado) {
      return { message: 'Si el email existe, recibirás un enlace de recuperación' };
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { empleadoId: empleado.empleadoId },
    });

    if (!usuario) {
      return { message: 'Si el email existe, recibirás un enlace de recuperación' };
    }

    await this.resetTokenRepository.update(
      { usuarioId: usuario.usuarioId, usado: false },
      { usado: true },
    );

    const token = uuidv4();
    const hashedToken = await bcrypt.hash(token, 10);

    const resetToken = this.resetTokenRepository.create({
      usuarioId: usuario.usuarioId,
      tokenHash: hashedToken,
      fechaCreacion: new Date(),
      fechaExpira: new Date(Date.now() + 4 * 60 * 60 * 1000),
      ipSolicitud: ipAddress,
      userAgent: userAgent,
      usado: false,
    });
    await this.resetTokenRepository.save(resetToken);

    const auditLog = this.auditRepository.create({
      usuarioId: usuario.usuarioId,
      modulo: 'AUTH',
      accion: 'FORGOT_PASSWORD',
      entidad: 'USUARIO',
      detalle: `Solicitud de recuperación desde ${ipAddress}`,
    });
    await this.auditRepository.save(auditLog);

    return {
      message: 'Si el email existe, recibirás un enlace de recuperación',
      resetToken: token,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokens = await this.resetTokenRepository.find({
      where: { usado: false },
      order: { fechaCreacion: 'DESC' },
    });

    let validToken: ResetPasswordToken | null = null;
    for (const tokenEntity of tokens) {
      const isValid = await bcrypt.compare(token, tokenEntity.tokenHash);
      if (isValid && new Date() < new Date(tokenEntity.fechaExpira)) {
        validToken = tokenEntity;
        break;
      }
    }

    if (!validToken) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usuarioRepository.update(validToken.usuarioId, {
      passwordHash: hashedPassword,
    });

    await this.resetTokenRepository.update(validToken.resetId, {
      usado: true,
      fechaUso: new Date(),
    });

    const auditLog = this.auditRepository.create({
      usuarioId: validToken.usuarioId,
      modulo: 'AUTH',
      accion: 'RESET_PASSWORD',
      entidad: 'USUARIO',
      detalle: 'Contraseña restablecida exitosamente',
    });
    await this.auditRepository.save(auditLog);

    return { message: 'Contraseña restablecida exitosamente' };
  }

  async getProfile(usuarioId: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuarioId },
      relations: ['roles'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const roles = usuario.roles?.length ? usuario.roles.map((r: Rol) => r.nombre) : [];

    let nombreCompleto = '';
    let email = '';
    let telefono = '';
    let puesto = '';
    let departamento = '';

    if (usuario.empleadoId) {
      const empleados = await this.dataSource.query(
        `SELECT TOP 1 e.nombres, e.apellidos, e.email, e.telefono, e.puesto, e.departamento 
         FROM EMPLEADO e 
         WHERE e.empleado_id = ${usuario.empleadoId}`,
      );
      if (empleados && empleados.length > 0) {
        nombreCompleto = `${empleados[0].nombres} ${empleados[0].apellidos}`;
        email = empleados[0].email || '';
        telefono = empleados[0].telefono || '';
        puesto = empleados[0].puesto || '';
        departamento = empleados[0].departamento || '';
      }
    }

    return {
      usuarioId: usuario.usuarioId,
      username: usuario.username,
      empleadoId: usuario.empleadoId,
      nombreCompleto,
      email,
      telefono,
      puesto,
      departamento,
      roles,
      ultimoLogin: usuario.ultimoLogin,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usuarioRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new ConflictException('El nombre de usuario ya existe');
    }

    const existingEmail = await this.empleadoRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const empleado = this.empleadoRepository.create({
      codigoEmpleado: registerDto.codigoEmpleado,
      nombres: registerDto.nombres,
      apellidos: registerDto.apellidos,
      email: registerDto.email,
      telefono: registerDto.telefono || null,
      fechaIngreso: new Date(),
      activo: true,
      puesto: registerDto.puesto || null,
    });
    const savedEmpleado = await this.empleadoRepository.save(empleado);

    const usuario = this.usuarioRepository.create({
      empleadoId: savedEmpleado.empleadoId,
      username: registerDto.username,
      passwordHash: hashedPassword,
      estado: 'activo',
    });
    const savedUsuario = await this.usuarioRepository.save(usuario);

    const rolEmpleado = await this.usuarioRepository.manager.findOne(Rol, {
      where: { nombre: 'Empleado' },
    });

    if (rolEmpleado) {
      savedUsuario.roles = [rolEmpleado];
      await this.usuarioRepository.save(savedUsuario);
    }

    const auditLog = this.auditRepository.create({
      usuarioId: savedUsuario.usuarioId,
      modulo: 'AUTH',
      accion: 'REGISTER',
      entidad: 'USUARIO',
      detalle: `Nuevo usuario registrado: ${registerDto.username}`,
    });
    await this.auditRepository.save(auditLog);

    return {
      message: 'Usuario registrado exitosamente',
      usuarioId: savedUsuario.usuarioId,
      empleadoId: savedEmpleado.empleadoId,
    };
  }
}
