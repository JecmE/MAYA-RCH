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
    async findAllEmpleados(activo) {
        let query = `
      SELECT e.empleado_id, e.codigo_empleado, e.nombres, e.apellidos, 
             e.email, e.telefono, e.fecha_ingreso, e.activo, e.puesto, 
             e.tarifa_hora, e.supervisor_id, e.departamento
      FROM EMPLEADO e
    `;
        if (activo !== undefined) {
            query += ` WHERE e.activo = ${activo === 'true' ? 1 : 0}`;
        }
        query += ` ORDER BY e.nombres ASC`;
        const empleados = await this.dataSource.query(query);
        return empleados.map((emp) => ({
            empleadoId: emp.empleado_id,
            codigoEmpleado: emp.codigo_empleado,
            nombres: emp.nombres,
            apellidos: emp.apellidos,
            nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
            email: emp.email,
            telefono: emp.telefono,
            fechaIngreso: emp.fecha_ingreso,
            activo: emp.activo,
            departamento: emp.departamento || null,
            puesto: emp.puesto,
            supervisorId: emp.supervisor_id,
        }));
    }
    async getMyProfile(empleadoId) {
        const empleados = await this.dataSource.query(`
      SELECT e.empleado_id, e.codigo_empleado, e.nombres, e.apellidos, 
             e.email, e.telefono, e.fecha_ingreso, e.puesto, e.tarifa_hora,
             e.departamento
      FROM EMPLEADO e
      WHERE e.empleado_id = ${empleadoId}
    `);
        if (!empleados || empleados.length === 0) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        const emp = empleados[0];
        const rolesResult = await this.dataSource.query(`
      SELECT r.nombre FROM ROL r 
      INNER JOIN USUARIO_ROL ur ON r.rol_id = ur.rol_id 
      WHERE ur.usuario_id = (SELECT usuario_id FROM USUARIO WHERE empleado_id = ${empleadoId})
    `);
        return {
            empleadoId: emp.empleado_id,
            codigoEmpleado: emp.codigo_empleado,
            nombres: emp.nombres,
            apellidos: emp.apellidos,
            nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
            email: emp.email,
            telefono: emp.telefono,
            fechaIngreso: emp.fecha_ingreso,
            departamento: emp.departamento || null,
            puesto: emp.puesto,
            tarifaHora: emp.tarifa_hora,
            roles: rolesResult.map((r) => r.nombre),
        };
    }
    async findEmpleadoById(id) {
        const empleados = await this.dataSource.query(`
      SELECT e.empleado_id, e.codigo_empleado, e.nombres, e.apellidos, 
             e.email, e.telefono, e.fecha_ingreso, e.activo, e.puesto, 
             e.tarifa_hora, e.supervisor_id, e.departamento
      FROM EMPLEADO e
      WHERE e.empleado_id = ${id}
    `);
        if (!empleados || empleados.length === 0) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        const emp = empleados[0];
        const rolesResult = await this.dataSource.query(`
      SELECT r.nombre FROM ROL r 
      INNER JOIN USUARIO_ROL ur ON r.rol_id = ur.rol_id 
      WHERE ur.usuario_id = (SELECT usuario_id FROM USUARIO WHERE empleado_id = ${id})
    `);
        return {
            empleadoId: emp.empleado_id,
            codigoEmpleado: emp.codigo_empleado,
            nombres: emp.nombres,
            apellidos: emp.apellidos,
            nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
            email: emp.email,
            telefono: emp.telefono,
            fechaIngreso: emp.fecha_ingreso,
            activo: emp.activo,
            departamento: emp.departamento || null,
            puesto: emp.puesto,
            tarifaHora: emp.tarifa_hora,
            supervisorId: emp.supervisor_id,
            roles: rolesResult.map((r) => r.nombre),
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
        const saved = (await this.empleadoRepository.save(empleado));
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
        const roles = await this.rolRepository.findByIds(createUsuarioDto.rolIds);
        const usuario = this.usuarioRepository.create({
            empleadoId,
            username: createUsuarioDto.username,
            passwordHash: hashedPassword,
            estado: 'activo',
            roles,
        });
        const saved = (await this.usuarioRepository.save(usuario));
        await this.auditRepository.save({
            usuarioId,
            modulo: 'USUARIOS',
            accion: 'CREATE',
            entidad: 'USUARIO',
            entidadId: saved.usuarioId,
            detalle: `Usuario creado para empleado: ${empleado.nombreCompleto}`,
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
            usuario.roles = await this.rolRepository.findByIds(updateUsuarioDto.rolIds);
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
    async getEquipoBySupervisor(supervisorId) {
        const empleados = await this.dataSource.query(`
      SELECT e.empleado_id, e.codigo_empleado, e.nombres, e.apellidos, 
             e.email, e.activo, e.puesto, e.departamento
      FROM EMPLEADO e
      WHERE e.supervisor_id = ${supervisorId}
      ORDER BY e.nombres ASC
    `);
        return empleados.map((emp) => ({
            empleadoId: emp.empleado_id,
            codigoEmpleado: emp.codigo_empleado,
            nombres: emp.nombres,
            apellidos: emp.apellidos,
            nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
            email: emp.email,
            departamento: emp.departamento || null,
            puesto: emp.puesto,
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