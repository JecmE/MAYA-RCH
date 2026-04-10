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
exports.BonoResultado = void 0;
const typeorm_1 = require("typeorm");
const empleado_entity_1 = require("./empleado.entity");
const regla_bono_entity_1 = require("./regla-bono.entity");
let BonoResultado = class BonoResultado {
};
exports.BonoResultado = BonoResultado;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'bono_res_id' }),
    __metadata("design:type", Number)
], BonoResultado.prototype, "bonoResId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'empleado_id' }),
    __metadata("design:type", Number)
], BonoResultado.prototype, "empleadoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'regla_bono_id' }),
    __metadata("design:type", Number)
], BonoResultado.prototype, "reglaBonoId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BonoResultado.prototype, "anio", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BonoResultado.prototype, "mes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], BonoResultado.prototype, "elegible", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'motivo_no_elegible', length: 255, nullable: true }),
    __metadata("design:type", String)
], BonoResultado.prototype, "motivoNoElegible", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_calculo' }),
    __metadata("design:type", Date)
], BonoResultado.prototype, "fechaCalculo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => empleado_entity_1.Empleado, (emp) => emp.bonoResultados),
    (0, typeorm_1.JoinColumn)({ name: 'empleado_id' }),
    __metadata("design:type", empleado_entity_1.Empleado)
], BonoResultado.prototype, "empleado", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => regla_bono_entity_1.ReglaBono, (rb) => rb.resultados),
    (0, typeorm_1.JoinColumn)({ name: 'regla_bono_id' }),
    __metadata("design:type", regla_bono_entity_1.ReglaBono)
], BonoResultado.prototype, "reglaBono", void 0);
exports.BonoResultado = BonoResultado = __decorate([
    (0, typeorm_1.Entity)('BONO_RESULTADO'),
    (0, typeorm_1.Unique)(['empleadoId', 'reglaBonoId', 'anio', 'mes'])
], BonoResultado);
//# sourceMappingURL=bono-resultado.entity.js.map