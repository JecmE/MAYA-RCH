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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const proyecto_entity_1 = require("../../entities/proyecto.entity");
const empleado_proyecto_entity_1 = require("../../entities/empleado-proyecto.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
let ProjectsService = class ProjectsService {
    constructor(proyectoRepository, empProyRepository, empleadoRepository, auditRepository, dataSource) {
        this.proyectoRepository = proyectoRepository;
        this.empProyRepository = empProyRepository;
        this.empleadoRepository = empleadoRepository;
        this.auditRepository = auditRepository;
        this.dataSource = dataSource;
    }
    async onModuleInit() {
        await this.ensureResponsableColumnExists();
    }
    async ensureResponsableColumnExists() {
        try {
            await this.dataSource.query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[PROYECTO]') AND name = 'responsable')
        BEGIN
            ALTER TABLE [dbo].[PROYECTO] ADD [responsable] NVARCHAR(100) NULL;
        END
      `);
        }
        catch (e) { }
    }
    async findAll() {
        const proyectos = await this.proyectoRepository.find({
            relations: ['empleadoProyectos', 'registrosTiempo'],
            order: { nombre: 'ASC' },
        });
        return proyectos.map((p) => {
            const horasAcumuladas = p.registrosTiempo?.reduce((sum, r) => sum + Number(r.horas), 0) || 0;
            return {
                proyectoId: p.proyectoId,
                codigo: p.codigo,
                nombre: p.nombre,
                descripcion: p.descripcion,
                responsable: p.responsable || 'Sin asignar',
                activo: p.activo,
                totalEmpleados: p.empleadoProyectos?.filter(ep => ep.activo).length || 0,
                horasAcumuladas: Math.round(horasAcumuladas * 100) / 100
            };
        });
    }
    async findMyProjects(empleadoId) {
        const asignaciones = await this.empProyRepository.find({
            where: { empleadoId, activo: true },
            relations: ['proyecto']
        });
        return asignaciones
            .filter(a => a.proyecto && a.proyecto.activo)
            .map(a => ({
            proyectoId: a.proyecto.proyectoId,
            codigo: a.proyecto.codigo,
            nombre: a.proyecto.nombre,
            activo: a.proyecto.activo
        }));
    }
    async findOne(id) {
        const proyecto = await this.proyectoRepository.findOne({
            where: { proyectoId: id },
            relations: ['empleadoProyectos', 'empleadoProyectos.empleado', 'registrosTiempo'],
        });
        if (!proyecto)
            throw new common_1.NotFoundException('Proyecto no encontrado');
        const horasAcumuladas = proyecto.registrosTiempo?.reduce((sum, r) => sum + Number(r.horas), 0) || 0;
        return {
            ...proyecto,
            horasAcumuladas: Math.round(horasAcumuladas * 100) / 100,
            asignaciones: proyecto.empleadoProyectos?.map(ep => ({
                empProyId: ep.empProyId,
                empleadoId: ep.empleadoId,
                nombreCompleto: `${ep.empleado?.nombres} ${ep.empleado?.apellidos}`,
                fechaInicio: ep.fechaInicio,
                fechaFin: ep.fechaFin,
                activo: ep.activo
            })) || []
        };
    }
    async create(createDto, usuarioId) {
        const proyecto = this.proyectoRepository.create(createDto);
        const saved = await this.proyectoRepository.save(proyecto);
        const savedSingle = Array.isArray(saved) ? saved[0] : saved;
        return this.findOne(savedSingle.proyectoId);
    }
    async update(id, updateDto, usuarioId) {
        const proyecto = await this.proyectoRepository.findOne({ where: { proyectoId: id } });
        if (!proyecto)
            throw new common_1.NotFoundException('Proyecto no encontrado');
        Object.assign(proyecto, updateDto);
        await this.proyectoRepository.save(proyecto);
        return this.findOne(id);
    }
    async assignEmployee(dto, usuarioId) {
        const { proyectoId, empleadoId, fechaInicio, fechaFin } = dto;
        let assignment = await this.empProyRepository.findOne({ where: { proyectoId, empleadoId } });
        if (assignment) {
            Object.assign(assignment, { activo: true, fechaInicio: new Date(fechaInicio), fechaFin: fechaFin ? new Date(fechaFin) : null });
        }
        else {
            assignment = this.empProyRepository.create({ proyectoId, empleadoId, fechaInicio: new Date(fechaInicio), fechaFin: fechaFin ? new Date(fechaFin) : null, activo: true });
        }
        await this.empProyRepository.save(assignment);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'PROYECTOS',
            accion: 'ASSIGN_EMPLOYEE',
            entidad: 'EMPLEADO_PROYECTO',
            entidadId: proyectoId,
            detalle: `Empleado ID ${empleadoId} asignado al proyecto ID ${proyectoId}`,
        });
        return this.findOne(proyectoId);
    }
    async unassignEmployee(empProyId, usuarioId) {
        const assignment = await this.empProyRepository.findOne({ where: { empProyId } });
        if (!assignment)
            throw new common_1.NotFoundException('Asignación no encontrada');
        assignment.activo = false;
        assignment.fechaFin = new Date();
        await this.empProyRepository.save(assignment);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'PROYECTOS',
            accion: 'UNASSIGN_EMPLOYEE',
            entidad: 'EMPLEADO_PROYECTO',
            entidadId: empProyId,
            detalle: `Empleado desvinculado de la asignación ID ${empProyId}`,
        });
        return { message: 'Desvinculado' };
    }
    async deactivate(id, usuarioId) {
        const proyecto = await this.proyectoRepository.findOne({ where: { proyectoId: id } });
        if (!proyecto)
            throw new common_1.NotFoundException('No encontrado');
        proyecto.activo = false;
        await this.proyectoRepository.save(proyecto);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'PROYECTOS',
            accion: 'DEACTIVATE',
            entidad: 'PROYECTO',
            entidadId: id,
            detalle: `Proyecto ID ${id} cerrado/desactivado`,
        });
        return { message: 'Cerrado' };
    }
    async getAdminStaff() {
        const staff = await this.empleadoRepository.find({
            relations: ['usuario', 'usuario.roles'],
            where: { activo: true }
        });
        return staff.filter(e => e.usuario?.roles?.some(r => ['Supervisor', 'RRHH', 'Administrador'].includes(r.nombre))).map(e => ({
            empleadoId: e.empleadoId,
            nombreCompleto: this.sanitizeString(`${e.nombres} ${e.apellidos}`)
        }));
    }
    sanitizeString(str) {
        if (!str)
            return '';
        return str
            .replace(/Rodr\?guez/g, 'Rodríguez')
            .replace(/Mart\?nez/g, 'Martínez')
            .replace(/Fern\?ndez/g, 'Fernández')
            .replace(/Garc\?a/g, 'García')
            .replace(/L\?pez/g, 'López')
            .replace(/Tecnolog\?a/g, 'Tecnología')
            .replace(/Mart\?n/g, 'Martín')
            .replace(/Bust\?n/g, 'Bustón')
            .replace(/S\?nchez/g, 'Sánchez')
            .replace(/G\?mez/g, 'Gómez')
            .replace(/P\?rez/g, 'Pérez')
            .replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á')
            .replace(/Ã©/g, 'é').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ');
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(proyecto_entity_1.Proyecto)),
    __param(1, (0, typeorm_1.InjectRepository)(empleado_proyecto_entity_1.EmpleadoProyecto)),
    __param(2, (0, typeorm_1.InjectRepository)(empleado_entity_1.Empleado)),
    __param(3, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map