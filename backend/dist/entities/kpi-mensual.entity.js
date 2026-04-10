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
exports.KpiMensual = void 0;
const typeorm_1 = require("typeorm");
const empleado_entity_1 = require("./empleado.entity");
let KpiMensual = class KpiMensual {
};
exports.KpiMensual = KpiMensual;
KpiMensual.CLASIFICACION_EXCELENTE = 'Excelente';
KpiMensual.CLASIFICACION_BUENO = 'Bueno';
KpiMensual.CLASIFICACION_OBSERVACION = 'En observacion';
KpiMensual.CLASIFICACION_RIESGO = 'En riesgo';
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'kpi_id' }),
    __metadata("design:type", Number)
], KpiMensual.prototype, "kpiId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'empleado_id' }),
    __metadata("design:type", Number)
], KpiMensual.prototype, "empleadoId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], KpiMensual.prototype, "anio", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], KpiMensual.prototype, "mes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dias_esperados' }),
    __metadata("design:type", Number)
], KpiMensual.prototype, "diasEsperados", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dias_trabajados' }),
    __metadata("design:type", Number)
], KpiMensual.prototype, "diasTrabajados", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], KpiMensual.prototype, "tardias", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], KpiMensual.prototype, "faltas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'horas_esperadas', type: 'decimal', precision: 6, scale: 2 }),
    __metadata("design:type", Number)
], KpiMensual.prototype, "horasEsperadas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'horas_trabajadas', type: 'decimal', precision: 6, scale: 2 }),
    __metadata("design:type", Number)
], KpiMensual.prototype, "horasTrabajadas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cumplimiento_pct', type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], KpiMensual.prototype, "cumplimientoPct", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], KpiMensual.prototype, "clasificacion", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_calculo' }),
    __metadata("design:type", Date)
], KpiMensual.prototype, "fechaCalculo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => empleado_entity_1.Empleado, (emp) => emp.kpis),
    (0, typeorm_1.JoinColumn)({ name: 'empleado_id' }),
    __metadata("design:type", empleado_entity_1.Empleado)
], KpiMensual.prototype, "empleado", void 0);
exports.KpiMensual = KpiMensual = __decorate([
    (0, typeorm_1.Entity)('KPI_MENSUAL'),
    (0, typeorm_1.Unique)(['empleadoId', 'anio', 'mes'])
], KpiMensual);
//# sourceMappingURL=kpi-mensual.entity.js.map