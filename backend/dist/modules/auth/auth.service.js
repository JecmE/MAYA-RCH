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
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
const usuario_entity_1 = require("../../entities/usuario.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const reset_password_token_entity_1 = require("../../entities/reset-password-token.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
const rol_entity_1 = require("../../entities/rol.entity");
let AuthService = class AuthService {
    constructor(usuarioRepository, empleadoRepository, resetTokenRepository, auditRepository, dataSource, jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.empleadoRepository = empleadoRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.auditRepository = auditRepository;
        this.dataSource = dataSource;
        this.jwtService = jwtService;
    }
    async login(loginDto, ipAddress) {
        const { username, password } = loginDto;
        const usuario = await this.usuarioRepository.findOne({
            where: { username },
        });
        if (!usuario) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        if (usuario.estado !== 'activo') {
            throw new common_1.UnauthorizedException('Usuario bloqueado o inactivo');
        }
        const isPasswordValid = await bcrypt.compare(password, usuario.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        usuario.ultimoLogin = new Date();
        await this.usuarioRepository.save(usuario);
        const rolesResult = await this.dataSource.query(`SELECT r.nombre FROM ROL r 
       INNER JOIN USUARIO_ROL ur ON r.rol_id = ur.rol_id 
       WHERE ur.usuario_id = ${usuario.usuarioId}`);
        const roles = rolesResult && rolesResult.length > 0 ? rolesResult.map((r) => r.nombre) : ['Empleado'];
        let nombreCompleto = '';
        let email = '';
        if (usuario.empleadoId) {
            const empleados = await this.dataSource.query(`SELECT TOP 1 nombres, apellidos, email FROM EMPLEADO WHERE empleado_id = ${usuario.empleadoId}`);
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
    async logout(usuarioId) {
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
    async forgotPassword(email, ipAddress, userAgent) {
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
        await this.resetTokenRepository.update({ usuarioId: usuario.usuarioId, usado: false }, { usado: true });
        const token = (0, uuid_1.v4)();
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
    async resetPassword(token, newPassword) {
        const tokens = await this.resetTokenRepository.find({
            where: { usado: false },
            order: { fechaCreacion: 'DESC' },
        });
        let validToken = null;
        for (const tokenEntity of tokens) {
            const isValid = await bcrypt.compare(token, tokenEntity.tokenHash);
            if (isValid && new Date() < new Date(tokenEntity.fechaExpira)) {
                validToken = tokenEntity;
                break;
            }
        }
        if (!validToken) {
            throw new common_1.BadRequestException('Token inválido o expirado');
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
    async getProfile(usuarioId) {
        const usuario = await this.usuarioRepository.findOne({
            where: { usuarioId },
            relations: ['roles'],
        });
        if (!usuario) {
            throw new common_1.UnauthorizedException('Usuario no encontrado');
        }
        const roles = usuario.roles?.length ? usuario.roles.map((r) => r.nombre) : [];
        let nombreCompleto = '';
        let email = '';
        let telefono = '';
        let puesto = '';
        let departamento = '';
        if (usuario.empleadoId) {
            const empleados = await this.dataSource.query(`SELECT TOP 1 e.nombres, e.apellidos, e.email, e.telefono, e.puesto, e.departamento 
         FROM EMPLEADO e 
         WHERE e.empleado_id = ${usuario.empleadoId}`);
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
    async register(registerDto) {
        const existingUser = await this.usuarioRepository.findOne({
            where: { username: registerDto.username },
        });
        if (existingUser) {
            throw new common_1.ConflictException('El nombre de usuario ya existe');
        }
        const existingEmail = await this.empleadoRepository.findOne({
            where: { email: registerDto.email },
        });
        if (existingEmail) {
            throw new common_1.ConflictException('El email ya está registrado');
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
        const rolEmpleado = await this.usuarioRepository.manager.findOne(rol_entity_1.Rol, {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __param(1, (0, typeorm_1.InjectRepository)(empleado_entity_1.Empleado)),
    __param(2, (0, typeorm_1.InjectRepository)(reset_password_token_entity_1.ResetPasswordToken)),
    __param(3, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map