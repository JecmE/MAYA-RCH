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
const uuid_1 = require("uuid");
let AuthService = class AuthService {
    constructor(usuarioRepository, empleadoRepository, rolRepository, resetTokenRepository, auditRepository, jwtService, dataSource) {
        this.usuarioRepository = usuarioRepository;
        this.empleadoRepository = empleadoRepository;
        this.rolRepository = rolRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.auditRepository = auditRepository;
        this.jwtService = jwtService;
        this.dataSource = dataSource;
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
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        if (usuario.estado !== 'activo') {
            throw new common_1.UnauthorizedException('Tu cuenta ha sido bloqueada o está inactiva. Contacta a RRHH.');
        }
        const isMatch = await bcrypt.compare(loginDto.password, usuario.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
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
                nombreCompleto: this.sanitizeString(usuario.empleado ? `${usuario.empleado.nombres} ${usuario.empleado.apellidos}` : ''),
                email: usuario.empleado?.email,
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
    async forgotPassword(email, ip, userAgent) {
        const empleado = await this.empleadoRepository.findOne({ where: { email } });
        if (!empleado) {
            return { message: 'Si el correo existe, se enviará un enlace de recuperación' };
        }
        const usuario = await this.usuarioRepository.findOne({ where: { empleadoId: empleado.empleadoId } });
        if (!usuario)
            return { message: 'Si el correo existe, se enviará un enlace de recuperación' };
        const token = (0, uuid_1.v4)();
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);
        const resetToken = this.resetTokenRepository.create({
            usuarioId: usuario.usuarioId,
            tokenHash: await bcrypt.hash(token, 10),
            fechaExpira: expires,
            ipSolicitud: ip,
            userAgent,
        });
        await this.resetTokenRepository.save(resetToken);
        console.log(`Token de recuperación para ${email}: ${token}`);
        return { message: 'Se ha enviado un enlace de recuperación a su correo' };
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        typeorm_2.DataSource])
], AuthService);
//# sourceMappingURL=auth.service.js.map