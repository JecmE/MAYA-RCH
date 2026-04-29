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
import { ParametroSistema } from '../../entities/parametro-sistema.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MailService } from '../mail/mail.service';
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
    @InjectRepository(ParametroSistema)
    private parametroRepository: Repository<ParametroSistema>,
    private jwtService: JwtService,
    private dataSource: DataSource,
    private mailService: MailService,
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
      console.log(`[AUTH] Login fallido: Usuario inexistente ${loginDto.username}`);
      await this.auditRepository.save({
        modulo: 'AUTH',
        accion: 'LOGIN_FAILED',
        entidad: 'USUARIO',
        detalle: `Intento de acceso fallido para usuario inexistente: ${loginDto.username} desde IP: ${ip}`,
        fechaHora: new Date()
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (usuario.estado !== 'activo') {
      await this.auditRepository.save({
        usuarioId: usuario.usuarioId,
        modulo: 'AUTH',
        accion: 'LOGIN_BLOCKED',
        entidad: 'USUARIO',
        entidadId: usuario.usuarioId,
        detalle: `Intento de acceso a cuenta suspendida: ${usuario.username} desde IP: ${ip}`,
        fechaHora: new Date()
      });
      throw new UnauthorizedException('Tu cuenta ha sido bloqueada o está inactiva. Contacta a RRHH.');
    }

    const isMatch = await bcrypt.compare(loginDto.password, usuario.passwordHash);
    if (!isMatch) {
      console.log(`[AUTH] Login fallido: Contraseña incorrecta para ${usuario.username}`);
      await this.auditRepository.save({
        usuarioId: usuario.usuarioId,
        modulo: 'AUTH',
        accion: 'LOGIN_FAILED',
        entidad: 'USUARIO',
        entidadId: usuario.usuarioId,
        detalle: `Contraseña incorrecta para usuario: ${usuario.username} desde IP: ${ip}`,
        fechaHora: new Date()
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      usuarioId: usuario.usuarioId,
      username: usuario.username,
      empleadoId: usuario.empleadoId,
      roles: usuario.roles.map((r) => r.nombre),
      sessionVersion: usuario.sessionVersion,
      requirePasswordChange: usuario.cambioPasswordObligatorio,
    };

    // LEER EXPIRACIÓN DINÁMICA DESDE PARÁMETROS
    const expParam = await this.parametroRepository.findOne({ where: { clave: 'jwt_expiracion', activo: true } });
    const expiresInMinutes = expParam ? parseInt(expParam.valor) : 60;

    usuario.ultimoLogin = new Date();
    usuario.ultimoIp = ip;
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
      token: this.jwtService.sign(payload, { expiresIn: `${expiresInMinutes}m` }),
      user: {
        usuarioId: usuario.usuarioId,
        username: usuario.username,
        roles: usuario.roles.map((r) => r.nombre),
        rolId: usuario.roles[0]?.rolId, // ID del primer rol para cargar permisos
        empleadoId: usuario.empleadoId,
        nombreCompleto: this.sanitizeString(
          usuario.empleado ? `${usuario.empleado.nombres} ${usuario.empleado.apellidos}` : '',
        ),
        email: usuario.empleado?.email,
        requirePasswordChange: usuario.cambioPasswordObligatorio,
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

  async forgotPassword(email: string, ip: string) {
    const empleado = await this.empleadoRepository.findOne({
      where: { email },
      relations: ['usuario']
    });

    if (!empleado || !empleado.usuario) {
      throw new BadRequestException('No existe una cuenta activa asociada a este correo electrónico.');
    }

    const usuario = empleado.usuario;
    if (usuario.estado !== 'activo') {
      throw new BadRequestException('Tu cuenta está suspendida. Contacta a soporte.');
    }

    // GENERAR CÓDIGO DE 6 DÍGITOS
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hora de vigencia

    // Guardar el código en la tabla de tokens (usamos hash por seguridad)
    const resetToken = this.resetTokenRepository.create({
      usuarioId: usuario.usuarioId,
      tokenHash: await bcrypt.hash(verificationCode, 10),
      fechaCreacion: new Date(),
      fechaExpira: expires,
      ipSolicitud: ip,
      usado: false
    });

    await this.resetTokenRepository.save(resetToken);

    // ENVIAR CORREO CON EL CÓDIGO
    await this.mailService.sendVerificationCodeEmail(
        empleado.email,
        `${empleado.nombres} ${empleado.apellidos}`,
        verificationCode
    );

    return { message: 'Código de verificación enviado.' };
  }

  async verifyCodeAndResetPassword(email: string, code: string, ip: string) {
    const empleado = await this.empleadoRepository.findOne({
        where: { email },
        relations: ['usuario']
    });

    if (!empleado || !empleado.usuario) throw new BadRequestException('Sesión inválida.');

    // Buscar el último código activo para este usuario
    const tokenRecord = await this.resetTokenRepository.findOne({
        where: { usuarioId: empleado.usuario.usuarioId, usado: false },
        order: { fechaCreacion: 'DESC' }
    });

    if (!tokenRecord) throw new BadRequestException('No hay una solicitud de recuperación activa.');

    // Validar expiración
    if (new Date() > tokenRecord.fechaExpira) {
        throw new BadRequestException('El código ha expirado. Solicita uno nuevo.');
    }

    // Validar el código (comparar hash)
    const isValid = await bcrypt.compare(code, tokenRecord.tokenHash);
    if (!isValid) {
        throw new BadRequestException('El código ingresado es incorrecto.');
    }

    // Código válido -> Generar Password Real
    const randomPassword = this.generateRandomPassword(10);
    const hash = await bcrypt.hash(randomPassword, 10);

    const usuario = empleado.usuario;
    usuario.passwordHash = hash;
    usuario.cambioPasswordObligatorio = true;
    await this.usuarioRepository.save(usuario);

    // Marcar código como usado
    tokenRecord.usado = true;
    tokenRecord.fechaUso = new Date();
    await this.resetTokenRepository.save(tokenRecord);

    // Enviar el correo final con la clave
    await this.mailService.sendCredentialsResetEmail(
        empleado.email,
        `${empleado.nombres} ${empleado.apellidos}`,
        usuario.username,
        randomPassword
    );

    await this.auditRepository.save({
        usuarioId: usuario.usuarioId,
        modulo: 'AUTH',
        accion: 'FORGOT_PASSWORD_SUCCESS',
        entidad: 'USUARIO',
        entidadId: usuario.usuarioId,
        detalle: `Recuperación completada exitosamente vía código 2FA desde IP: ${ip}.`,
        fechaHora: new Date()
    });

    return { message: 'Tu nueva contraseña ha sido enviada a tu correo.' };
  }

  private generateRandomPassword(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
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
