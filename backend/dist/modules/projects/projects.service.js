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
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let ProjectsService = class ProjectsService {
    constructor(proyectoRepository, auditRepository) {
        this.proyectoRepository = proyectoRepository;
        this.auditRepository = auditRepository;
    }
    async findAll() {
        const proyectos = await this.proyectoRepository.find({
            where: { activo: true },
            order: { nombre: 'ASC' },
        });
        return proyectos.map((p) => ({
            proyectoId: p.proyectoId,
            codigo: p.codigo,
            nombre: p.nombre,
            descripcion: p.descripcion,
            departamentoId: p.departamentoId,
            activo: p.activo,
        }));
    }
    async findOne(id) {
        const proyecto = await this.proyectoRepository.findOne({
            where: { proyectoId: id },
        });
        if (!proyecto) {
            throw new common_1.NotFoundException('Proyecto no encontrado');
        }
        return {
            proyectoId: proyecto.proyectoId,
            codigo: proyecto.codigo,
            nombre: proyecto.nombre,
            descripcion: proyecto.descripcion,
            departamentoId: proyecto.departamentoId,
            activo: proyecto.activo,
        };
    }
    async create(createDto, usuarioId) {
        const proyecto = this.proyectoRepository.create(createDto);
        const saved = (await this.proyectoRepository.save(proyecto));
        await this.auditRepository.save({
            usuarioId,
            modulo: 'PROYECTOS',
            accion: 'CREATE',
            entidad: 'PROYECTO',
            entidadId: saved.proyectoId,
            detalle: `Proyecto creado: ${saved.nombre}`,
        });
        return this.findOne(saved.proyectoId);
    }
    async update(id, updateDto, usuarioId) {
        const proyecto = await this.proyectoRepository.findOne({
            where: { proyectoId: id },
        });
        if (!proyecto) {
            throw new common_1.NotFoundException('Proyecto no encontrado');
        }
        Object.assign(proyecto, updateDto);
        await this.proyectoRepository.save(proyecto);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'PROYECTOS',
            accion: 'UPDATE',
            entidad: 'PROYECTO',
            entidadId: id,
            detalle: `Proyecto actualizado: ${proyecto.nombre}`,
        });
        return this.findOne(id);
    }
    async deactivate(id, usuarioId) {
        const proyecto = await this.proyectoRepository.findOne({
            where: { proyectoId: id },
        });
        if (!proyecto) {
            throw new common_1.NotFoundException('Proyecto no encontrado');
        }
        proyecto.activo = false;
        await this.proyectoRepository.save(proyecto);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'PROYECTOS',
            accion: 'DEACTIVATE',
            entidad: 'PROYECTO',
            entidadId: id,
            detalle: `Proyecto desactivado: ${proyecto.nombre}`,
        });
        return { message: 'Proyecto desactivado correctamente' };
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(proyecto_entity_1.Proyecto)),
    __param(1, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map