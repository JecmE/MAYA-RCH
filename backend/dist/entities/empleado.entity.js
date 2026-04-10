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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Empleado = void 0;
const typeorm_1 = require("typeorm");
const usuario_entity_1 = require("./usuario.entity");
const solicitud_permiso_entity_1 = require("./solicitud-permiso.entity");
const vacacion_saldo_entity_1 = require("./vacacion-saldo.entity");
const vacacion_movimiento_entity_1 = require("./vacacion-movimiento.entity");
const registro_tiempo_entity_1 = require("./registro-tiempo.entity");
const empleado_turno_entity_1 = require("./empleado-turno.entity");
const registro_asistencia_entity_1 = require("./registro-asistencia.entity");
const empleado_proyecto_entity_1 = require("./empleado-proyecto.entity");
const kpi_mensual_entity_1 = require("./kpi-mensual.entity");
const bono_resultado_entity_1 = require("./bono-resultado.entity");
const planilla_empleado_entity_1 = require("./planilla-empleado.entity");
let Empleado = class Empleado {
    get nombreCompleto() {
        return `${this.nombres} ${this.apellidos}`;
    }
};
exports.Empleado = Empleado;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'empleado_id' }),
    __metadata("design:type", Number)
], Empleado.prototype, "empleadoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supervisor_id', nullable: true }),
    __metadata("design:type", Number)
], Empleado.prototype, "supervisorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'departamento', length: 100, nullable: true }),
    __metadata("design:type", String)
], Empleado.prototype, "departamento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'codigo_empleado', length: 20, unique: true }),
    __metadata("design:type", String)
], Empleado.prototype, "codigoEmpleado", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Empleado.prototype, "nombres", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Empleado.prototype, "apellidos", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, unique: true }),
    __metadata("design:type", String)
], Empleado.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telefono', length: 20, nullable: true }),
    __metadata("design:type", String)
], Empleado.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_ingreso', type: 'date' }),
    __metadata("design:type", Date)
], Empleado.prototype, "fechaIngreso", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Boolean)
], Empleado.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Empleado.prototype, "puesto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tarifa_hora', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Empleado.prototype, "tarifaHora", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Empleado, (emp) => emp.supervisees, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'supervisor_id' }),
    __metadata("design:type", Empleado)
], Empleado.prototype, "supervisor", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Empleado, (emp) => emp.supervisor),
    __metadata("design:type", Array)
], Empleado.prototype, "supervisees", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => usuario_entity_1.Usuario, (user) => user.empleado),
    __metadata("design:type", usuario_entity_1.Usuario)
], Empleado.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => vacacion_saldo_entity_1.VacacionSaldo, (vs) => vs.empleado),
    __metadata("design:type", vacacion_saldo_entity_1.VacacionSaldo)
], Empleado.prototype, "vacacionSaldo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => solicitud_permiso_entity_1.SolicitudPermiso, (sp) => sp.empleado),
    __metadata("design:type", Array)
], Empleado.prototype, "solicitudes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => vacacion_movimiento_entity_1.VacacionMovimiento, (vm) => vm.empleado),
    __metadata("design:type", Array)
], Empleado.prototype, "vacacionMovimientos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => registro_tiempo_entity_1.RegistroTiempo, (rt) => rt.empleado),
    __metadata("design:type", Array)
], Empleado.prototype, "registroTiempos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => empleado_turno_entity_1.EmpleadoTurno, (et) => et.empleado),
    __metadata("design:type", Array)
], Empleado.prototype, "empleadoTurnos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => registro_asistencia_entity_1.RegistroAsistencia, (ra) => ra.empleado),
    __metadata("design:type", Array)
], Empleado.prototype, "registrosAsistencia", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => empleado_proyecto_entity_1.EmpleadoProyecto, (ep) => ep.empleado),
    __metadata("design:type", Array)
], Empleado.prototype, "empleadoProyectos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => kpi_mensual_entity_1.KpiMensual, (kpi) => kpi.empleado),
    __metadata("design:type", Array)
], Empleado.prototype, "kpis", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bono_resultado_entity_1.BonoResultado, (br) => br.empleado),
    __metadata("design:type", Array)
], Empleado.prototype, "bonoResultados", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => planilla_empleado_entity_1.PlanillaEmpleado, (pe) => pe.empleado),
    __metadata("design:type", Array)
], Empleado.prototype, "planillasEmpleado", void 0);
exports.Empleado = Empleado = __decorate([
    (0, typeorm_1.Entity)('EMPLEADO')
], Empleado);
//# sourceMappingURL=empleado.entity.js.map