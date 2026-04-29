"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const usuario_entity_1 = require("../../entities/usuario.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const rol_entity_1 = require("../../entities/rol.entity");
const reset_password_token_entity_1 = require("../../entities/reset-password-token.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
const parametro_sistema_entity_1 = require("../../entities/parametro-sistema.entity");
const mail_service_1 = require("../mail/mail.service");
let AuthService = class AuthService {
    constructor(usuarioRepository, empleadoRepository, rolRepository, resetTokenRepository, auditRepository, parametroRepository, jwtService, dataSource, mailService) {
        this.usuarioRepository = usuarioRepository;
        this.empleadoRepository = empleadoRepository;
        this.rolRepository = rolRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.auditRepository = auditRepository;
        this.parametroRepository = parametroRepository;
        this.jwtService = jwtService;
        this.dataSource = dataSource;
        this.mailService = mailService;
    }
    sanitizeString(str) {
        if (!str)
            return '';
        return str
            .replace(/\?/g, (match, offset, original) => {
            if (original.includes('Tecnolog'))
                return 'í';
            if (original.includes('Garc'))
                return 'í';
            if (original.includes('Rodr'))
                return 'í';
            if (original.includes('Mart'))
                return 'í';
            return 'í';
        })
            .replace(/Ã­/g, 'í')
            .replace(/Ã³/g, 'ó')
            .replace(/Ã¡/g, 'á')
            .replace(/Ã©/g, 'é')
            .replace(/Ãº/g, 'ú')
            .replace(/Ã±/g, 'ñ');
    }
    async login(loginDto, ip) {
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
            throw new common_1.UnauthorizedException('Credenciales inválidas');
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
            throw new common_1.UnauthorizedException('Tu cuenta ha sido bloqueada o está inactiva. Contacta a RRHH.');
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
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const payload = {
            usuarioId: usuario.usuarioId,
            username: usuario.username,
            empleadoId: usuario.empleadoId,
            roles: usuario.roles.map((r) => r.nombre),
            sessionVersion: usuario.sessionVersion,
            requirePasswordChange: usuario.cambioPasswordObligatorio,
        };
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
                rolId: usuario.roles[0]?.rolId,
                empleadoId: usuario.empleadoId,
                nombreCompleto: this.sanitizeString(usuario.empleado ? `${usuario.empleado.nombres} ${usuario.empleado.apellidos}` : ''),
                email: usuario.empleado?.email,
                requirePasswordChange: usuario.cambioPasswordObligatorio,
            },
        };
    }
    async logout(usuarioId) {
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
    async forgotPassword(email, ip) {
        const empleado = await this.empleadoRepository.findOne({
            where: { email },
            relations: ['usuario']
        });
        if (!empleado || !empleado.usuario) {
            throw new common_1.BadRequestException('No existe una cuenta activa asociada a este correo electrónico.');
        }
        const usuario = empleado.usuario;
        if (usuario.estado !== 'activo') {
            throw new common_1.BadRequestException('Tu cuenta está suspendida. Contacta a soporte.');
        }
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);
        const resetToken = this.resetTokenRepository.create({
            usuarioId: usuario.usuarioId,
            tokenHash: await bcrypt.hash(verificationCode, 10),
            fechaCreacion: new Date(),
            fechaExpira: expires,
            ipSolicitud: ip,
            usado: false
        });
        await this.resetTokenRepository.save(resetToken);
        await this.mailService.sendVerificationCodeEmail(empleado.email, `${empleado.nombres} ${empleado.apellidos}`, verificationCode);
        return { message: 'Código de verificación enviado.' };
    }
    async verifyCodeAndResetPassword(email, code, ip) {
        const empleado = await this.empleadoRepository.findOne({
            where: { email },
            relations: ['usuario']
        });
        if (!empleado || !empleado.usuario)
            throw new common_1.BadRequestException('Sesión inválida.');
        const tokenRecord = await this.resetTokenRepository.findOne({
            where: { usuarioId: empleado.usuario.usuarioId, usado: false },
            order: { fechaCreacion: 'DESC' }
        });
        if (!tokenRecord)
            throw new common_1.BadRequestException('No hay una solicitud de recuperación activa.');
        if (new Date() > tokenRecord.fechaExpira) {
            throw new common_1.BadRequestException('El código ha expirado. Solicita uno nuevo.');
        }
        const isValid = await bcrypt.compare(code, tokenRecord.tokenHash);
        if (!isValid) {
            throw new common_1.BadRequestException('El código ingresado es incorrecto.');
        }
        const randomPassword = this.generateRandomPassword(10);
        const hash = await bcrypt.hash(randomPassword, 10);
        const usuario = empleado.usuario;
        usuario.passwordHash = hash;
        usuario.cambioPasswordObligatorio = true;
        await this.usuarioRepository.save(usuario);
        tokenRecord.usado = true;
        tokenRecord.fechaUso = new Date();
        await this.resetTokenRepository.save(tokenRecord);
        await this.mailService.sendCredentialsResetEmail(empleado.email, `${empleado.nombres} ${empleado.apellidos}`, usuario.username, randomPassword);
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
    generateRandomPassword(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
    async resetPassword(token, newPassword) {
        throw new common_1.BadRequestException('Funcionalidad en desarrollo');
    }
    async getProfile(usuarioId) {
        const usuario = await this.usuarioRepository.findOne({
            where: { usuarioId },
            relations: ['roles', 'empleado'],
        });
        if (!usuario) {
            throw new common_1.UnauthorizedException('Usuario no encontrado');
        }
        const roles = usuario.roles?.length ? usuario.roles.map((r) => r.nombre) : [];
        return {
            usuarioId: usuario.usuarioId,
            username: usuario.username,
            empleadoId: usuario.empleadoId,
            nombreCompleto: this.sanitizeString(usuario.empleado ? `${usuario.empleado.nombres} ${usuario.empleado.apellidos}` : ''),
            email: usuario.empleado?.email,
            roles,
            ultimoLogin: usuario.ultimoLogin,
        };
    }
    async register(registerDto) {
        const existingUser = await this.usuarioRepository.findOne({
            where: { username: registerDto.username },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('El nombre de usuario ya existe');
        }
        const existingEmpleado = await this.empleadoRepository.findOne({
            where: { email: registerDto.email },
        });
        if (existingEmpleado) {
            throw new common_1.BadRequestException('El correo ya está registrado');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __param(1, (0, typeorm_1.InjectRepository)(empleado_entity_1.Empleado)),
    __param(2, (0, typeorm_1.InjectRepository)(rol_entity_1.Rol)),
    __param(3, (0, typeorm_1.InjectRepository)(reset_password_token_entity_1.ResetPasswordToken)),
    __param(4, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(5, (0, typeorm_1.InjectRepository)(parametro_sistema_entity_1.ParametroSistema)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        typeorm_2.DataSource,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map