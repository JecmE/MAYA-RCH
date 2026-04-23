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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const empleado_entity_1 = require("../../entities/empleado.entity");
const usuario_entity_1 = require("../../entities/usuario.entity");
const rol_entity_1 = require("../../entities/rol.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let UsersService = class UsersService {
    constructor(empleadoRepository, usuarioRepository, rolRepository, auditRepository, dataSource) {
        this.empleadoRepository = empleadoRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.auditRepository = auditRepository;
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
            if (original.includes('Logistica'))
                return 'í';
            if (original.includes('Administraci'))
                return 'ó';
            return '?';
        })
            .replace(/Ã­/g, 'í')
            .replace(/Ã³/g, 'ó')
            .replace(/Ã¡/g, 'á')
            .replace(/Ã©/g, 'é')
            .replace(/Ãº/g, 'ú')
            .replace(/Ã±/g, 'ñ');
    }
    async findAllEmpleados(activo) {
        const where = {};
        if (activo !== undefined) {
            where.activo = activo === 'true';
        }
        const empleados = await this.empleadoRepository.find({
            where,
            order: { nombres: 'ASC' },
        });
        return empleados.map((emp) => ({
            empleadoId: emp.empleadoId,
            codigoEmpleado: emp.codigoEmpleado,
            nombres: this.sanitizeString(emp.nombres),
            apellidos: this.sanitizeString(emp.apellidos),
            nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
            email: emp.email,
            telefono: emp.telefono,
            fechaIngreso: emp.fechaIngreso,
            activo: emp.activo,
            departamento: this.sanitizeString(emp.departamento),
            puesto: this.sanitizeString(emp.puesto),
            supervisorId: emp.supervisorId,
        }));
    }
    async getMyProfile(empleadoId) {
        const emp = await this.empleadoRepository.findOne({
            where: { empleadoId },
            relations: ['usuario', 'usuario.roles'],
        });
        if (!emp) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        return {
            empleadoId: emp.empleadoId,
            codigoEmpleado: emp.codigoEmpleado,
            nombres: this.sanitizeString(emp.nombres),
            apellidos: this.sanitizeString(emp.apellidos),
            nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
            email: emp.email,
            telefono: emp.telefono,
            fechaIngreso: emp.fechaIngreso,
            departamento: this.sanitizeString(emp.departamento),
            puesto: this.sanitizeString(emp.puesto),
            tarifaHora: emp.tarifaHora,
            roles: emp.usuario?.roles?.map((r) => r.nombre) || [],
        };
    }
    async findEmpleadoById(id) {
        const emp = await this.empleadoRepository.findOne({
            where: { empleadoId: id },
            relations: ['usuario', 'usuario.roles'],
        });
        if (!emp) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        return {
            empleadoId: emp.empleadoId,
            codigoEmpleado: emp.codigoEmpleado,
            nombres: this.sanitizeString(emp.nombres),
            apellidos: this.sanitizeString(emp.apellidos),
            nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
            email: emp.email,
            telefono: emp.telefono,
            fechaIngreso: emp.fechaIngreso,
            activo: emp.activo,
            departamento: this.sanitizeString(emp.departamento),
            puesto: this.sanitizeString(emp.puesto),
            tarifaHora: emp.tarifaHora,
            supervisorId: emp.supervisorId,
            roles: emp.usuario?.roles?.map((r) => r.nombre) || [],
        };
    }
    async createEmpleado(createEmpleadoDto, usuarioId) {
        const existing = await this.empleadoRepository.findOne({
            where: [
                { email: createEmpleadoDto.email },
                { codigoEmpleado: createEmpleadoDto.codigoEmpleado },
            ],
        });
        if (existing) {
            throw new common_1.BadRequestException('Ya existe un empleado con ese email o código');
        }
        const empleado = this.empleadoRepository.create({
            ...createEmpleadoDto,
            activo: true,
        });
        const saved = await this.empleadoRepository.save(empleado);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'EMPLEADOS',
            accion: 'CREATE',
            entidad: 'EMPLEADO',
            entidadId: saved.empleadoId,
            detalle: `Empleado creado: ${saved.nombres} ${saved.apellidos}`,
        });
        return this.findEmpleadoById(saved.empleadoId);
    }
    async updateEmpleado(id, updateEmpleadoDto, usuarioId) {
        const empleado = await this.empleadoRepository.findOne({
            where: { empleadoId: id },
        });
        if (!empleado) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        Object.assign(empleado, updateEmpleadoDto);
        await this.empleadoRepository.save(empleado);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'EMPLEADOS',
            accion: 'UPDATE',
            entidad: 'EMPLEADO',
            entidadId: id,
            detalle: `Empleado actualizado`,
        });
        return this.findEmpleadoById(id);
    }
    async deactivateEmpleado(id, usuarioId) {
        const empleado = await this.empleadoRepository.findOne({
            where: { empleadoId: id },
        });
        if (!empleado) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        empleado.activo = false;
        await this.empleadoRepository.save(empleado);
        const usuario = await this.usuarioRepository.findOne({
            where: { empleadoId: id },
        });
        if (usuario) {
            usuario.estado = 'bloqueado';
            await this.usuarioRepository.save(usuario);
        }
        await this.auditRepository.save({
            usuarioId,
            modulo: 'EMPLEADOS',
            accion: 'DEACTIVATE',
            entidad: 'EMPLEADO',
            entidadId: id,
            detalle: `Empleado desactivado: ${empleado.nombres} ${empleado.apellidos}`,
        });
        return { message: 'Empleado desactivado correctamente' };
    }
    async createUsuario(empleadoId, createUsuarioDto, usuarioId) {
        const empleado = await this.empleadoRepository.findOne({
            where: { empleadoId },
        });
        if (!empleado) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        const existingUsuario = await this.usuarioRepository.findOne({
            where: { empleadoId },
        });
        if (existingUsuario) {
            throw new common_1.BadRequestException('El empleado ya tiene un usuario asignado');
        }
        const existingUsername = await this.usuarioRepository.findOne({
            where: { username: createUsuarioDto.username },
        });
        if (existingUsername) {
            throw new common_1.BadRequestException('El nombre de usuario ya existe');
        }
        const hashedPassword = await bcrypt.hash(createUsuarioDto.password, 10);
        const roles = await this.rolRepository.find({
            where: { rolId: (0, typeorm_2.In)(createUsuarioDto.rolIds || []) }
        });
        const usuario = this.usuarioRepository.create({
            empleadoId,
            username: createUsuarioDto.username,
            passwordHash: hashedPassword,
            estado: 'activo',
            roles,
        });
        const saved = await this.usuarioRepository.save(usuario);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'USUARIOS',
            accion: 'CREATE',
            entidad: 'USUARIO',
            entidadId: saved.usuarioId,
            detalle: `Usuario creado para empleado: ${empleado.nombres} ${empleado.apellidos}`,
        });
        return {
            usuarioId: saved.usuarioId,
            empleadoId: saved.empleadoId,
            username: saved.username,
            estado: saved.estado,
            roles: roles.map((r) => r.nombre),
        };
    }
    async updateUsuario(empleadoId, updateUsuarioDto, usuarioId) {
        const usuario = await this.usuarioRepository.findOne({
            where: { empleadoId },
            relations: ['roles'],
        });
        if (!usuario) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (updateUsuarioDto.password) {
            usuario.passwordHash = await bcrypt.hash(updateUsuarioDto.password, 10);
        }
        if (updateUsuarioDto.estado) {
            usuario.estado = updateUsuarioDto.estado;
        }
        if (updateUsuarioDto.rolIds) {
            usuario.roles = await this.rolRepository.find({
                where: { rolId: (0, typeorm_2.In)(updateUsuarioDto.rolIds) }
            });
        }
        await this.usuarioRepository.save(usuario);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'USUARIOS',
            accion: 'UPDATE',
            entidad: 'USUARIO',
            entidadId: usuario.usuarioId,
            detalle: `Usuario actualizado`,
        });
        return {
            usuarioId: usuario.usuarioId,
            username: usuario.username,
            estado: usuario.estado,
            roles: usuario.roles.map((r) => r.nombre),
        };
    }
    async changePassword(usuarioId, changePasswordDto) {
        const usuario = await this.usuarioRepository.findOne({
            where: { usuarioId },
        });
        if (!usuario) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const isMatch = await bcrypt.compare(changePasswordDto.oldPassword, usuario.passwordHash);
        if (!isMatch) {
            throw new common_1.BadRequestException('La contraseña actual es incorrecta');
        }
        usuario.passwordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);
        await this.usuarioRepository.save(usuario);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'SEGURIDAD',
            accion: 'UPDATE',
            entidad: 'USUARIO',
            entidadId: usuarioId,
            detalle: `Contraseña actualizada por el propio usuario`,
        });
        return { message: 'Contraseña actualizada correctamente' };
    }
    async getEquipoBySupervisor(supervisorId) {
        const empleados = await this.empleadoRepository.find({
            where: { supervisorId },
            order: { nombres: 'ASC' }
        });
        return empleados.map((emp) => ({
            empleadoId: emp.empleadoId,
            codigoEmpleado: emp.codigoEmpleado,
            nombres: this.sanitizeString(emp.nombres),
            apellidos: this.sanitizeString(emp.apellidos),
            nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
            email: emp.email,
            departamento: this.sanitizeString(emp.departamento),
            puesto: this.sanitizeString(emp.puesto),
            activo: emp.activo,
        }));
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(empleado_entity_1.Empleado)),
    __param(1, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __param(2, (0, typeorm_1.InjectRepository)(rol_entity_1.Rol)),
    __param(3, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], UsersService);
//# sourceMappingURL=users.service.js.map