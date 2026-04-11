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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const registro_asistencia_entity_1 = require("../../entities/registro-asistencia.entity");
const empleado_entity_1 = require("../../entities/empleado.entity");
const empleado_turno_entity_1 = require("../../entities/empleado-turno.entity");
const turno_entity_1 = require("../../entities/turno.entity");
const ajuste_asistencia_entity_1 = require("../../entities/ajuste-asistencia.entity");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let AttendanceService = class AttendanceService {
    constructor(asistenciaRepository, empleadoRepository, empleadoTurnoRepository, turnoRepository, ajusteRepository, auditRepository, dataSource) {
        this.asistenciaRepository = asistenciaRepository;
        this.empleadoRepository = empleadoRepository;
        this.empleadoTurnoRepository = empleadoTurnoRepository;
        this.turnoRepository = turnoRepository;
        this.ajusteRepository = ajusteRepository;
        this.auditRepository = auditRepository;
        this.dataSource = dataSource;
    }
    async registerEntry(empleadoId, usuarioId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await this.asistenciaRepository.findOne({
            where: { empleadoId, fecha: today },
        });
        if (existing && existing.horaEntradaReal) {
            throw new common_1.BadRequestException('Ya se registró la entrada hoy');
        }
        const empleadoTurno = await this.empleadoTurnoRepository.findOne({
            where: { empleadoId, activo: true },
            relations: ['turno'],
        });
        if (!empleadoTurno) {
            throw new common_1.BadRequestException('No tiene turno asignado');
        }
        const turno = empleadoTurno.turno;
        const now = new Date();
        const horaEntradaEsperada = this.getTimeFromString(turno.horaEntrada);
        let minutosTardia = 0;
        if (now > horaEntradaEsperada) {
            const diff = now.getTime() - horaEntradaEsperada.getTime();
            minutosTardia = Math.floor(diff / 60000) - turno.toleranciaMinutos;
            if (minutosTardia < 0)
                minutosTardia = 0;
        }
        if (existing) {
            existing.horaEntradaReal = now;
            existing.minutosTardia = minutosTardia;
            existing.empleadoTurnoId = empleadoTurno.empleadoTurnoId;
            if (existing.horaSalidaReal) {
                existing.estadoJornada = registro_asistencia_entity_1.RegistroAsistencia.ESTADO_COMPLETADA;
                existing.horasTrabajadas = this.calculateHours(existing.horaEntradaReal, existing.horaSalidaReal);
            }
            else {
                existing.estadoJornada = registro_asistencia_entity_1.RegistroAsistencia.ESTADO_INCOMPLETA;
            }
            await this.asistenciaRepository.save(existing);
            await this.auditRepository.save({
                usuarioId,
                modulo: 'ASISTENCIA',
                accion: 'CHECK_IN',
                entidad: 'REGISTRO_ASISTENCIA',
                entidadId: existing.asistenciaId,
                detalle: `Entrada registrada${minutosTardia > 0 ? `, ${minutosTardia} min tardanza` : ''}`,
            });
            return {
                message: 'Entrada registrada',
                asistencia: existing,
                minutosTardia,
            };
        }
        const asistencia = this.asistenciaRepository.create({
            empleadoId,
            empleadoTurnoId: empleadoTurno.empleadoTurnoId,
            fecha: today,
            horaEntradaReal: now,
            minutosTardia,
            estadoJornada: registro_asistencia_entity_1.RegistroAsistencia.ESTADO_PENDIENTE,
        });
        const saved = await this.asistenciaRepository.save(asistencia);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'ASISTENCIA',
            accion: 'CHECK_IN',
            entidad: 'REGISTRO_ASISTENCIA',
            entidadId: saved.asistenciaId,
            detalle: `Entrada registrada${minutosTardia > 0 ? `, ${minutosTardia} min tardanza` : ''}`,
        });
        return {
            message: 'Entrada registrada',
            asistencia: saved,
            minutosTardia,
        };
    }
    async registerExit(empleadoId, usuarioId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const asistencia = await this.asistenciaRepository.findOne({
            where: { empleadoId, fecha: today },
        });
        if (!asistencia) {
            throw new common_1.BadRequestException('No se ha registrado entrada hoy');
        }
        if (asistencia.horaSalidaReal) {
            throw new common_1.BadRequestException('Ya se registró la salida hoy');
        }
        const now = new Date();
        asistencia.horaSalidaReal = now;
        asistencia.estadoJornada = registro_asistencia_entity_1.RegistroAsistencia.ESTADO_COMPLETADA;
        const horaEntrada = asistencia.horaEntradaReal instanceof Date
            ? asistencia.horaEntradaReal
            : new Date(asistencia.horaEntradaReal);
        const horasTra = this.calculateHours(horaEntrada, now);
        asistencia.horasTrabajadas = parseFloat(horasTra.toFixed(2));
        await this.asistenciaRepository.save(asistencia);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'ASISTENCIA',
            accion: 'CHECK_OUT',
            entidad: 'REGISTRO_ASISTENCIA',
            entidadId: asistencia.asistenciaId,
            detalle: `Salida registrada, ${asistencia.horasTrabajadas} horas trabajadas`,
        });
        return {
            message: 'Salida registrada',
            asistencia,
        };
    }
    async getTodayStatus(empleadoId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const asistencia = await this.asistenciaRepository.findOne({
            where: { empleadoId, fecha: today },
        });
        const empleadoTurno = await this.empleadoTurnoRepository.findOne({
            where: { empleadoId, activo: true },
            relations: ['turno'],
        });
        const turnoNombre = empleadoTurno?.turno?.nombre || 'Sin turno';
        const toleranciaMinutos = empleadoTurno?.turno?.toleranciaMinutos || 0;
        if (!asistencia) {
            return {
                estadoJornada: 'sin_registro',
                fecha: today,
                tieneEntrada: false,
                tieneSalida: false,
                turnoNombre,
                toleranciaMinutos,
            };
        }
        return {
            asistenciaId: asistencia.asistenciaId,
            fecha: asistencia.fecha,
            horaEntradaReal: asistencia.horaEntradaReal,
            horaSalidaReal: asistencia.horaSalidaReal,
            minutosTardia: asistencia.minutosTardia,
            horasTrabajadas: asistencia.horasTrabajadas,
            estadoJornada: asistencia.estadoJornada,
            observacion: asistencia.observacion,
            tieneEntrada: !!asistencia.horaEntradaReal,
            tieneSalida: !!asistencia.horaSalidaReal,
            turnoNombre,
            toleranciaMinutos,
        };
    }
    async getHistory(empleadoId, fechaInicio, fechaFin) {
        const where = { empleadoId };
        if (fechaInicio && fechaFin) {
            where.fecha = (0, typeorm_2.Between)(new Date(fechaInicio), new Date(fechaFin));
        }
        else if (fechaInicio) {
            where.fecha = (0, typeorm_2.MoreThanOrEqual)(new Date(fechaInicio));
        }
        else if (fechaFin) {
            where.fecha = (0, typeorm_2.LessThanOrEqual)(new Date(fechaFin));
        }
        const registros = await this.asistenciaRepository.find({
            where,
            order: { fecha: 'DESC' },
        });
        return registros.map((r) => ({
            asistenciaId: r.asistenciaId,
            fecha: r.fecha,
            horaEntradaReal: r.horaEntradaReal,
            horaSalidaReal: r.horaSalidaReal,
            minutosTardia: r.minutosTardia,
            horasTrabajadas: r.horasTrabajadas,
            estadoJornada: r.estadoJornada,
            observacion: r.observacion,
        }));
    }
    async adjustAttendance(asistenciaId, adjustDto, usuarioId) {
        const asistencia = await this.asistenciaRepository.findOne({
            where: { asistenciaId },
        });
        if (!asistencia) {
            throw new common_1.NotFoundException('Registro de asistencia no encontrado');
        }
        const { campo, valorAnterior, valorNuevo, motivo } = adjustDto;
        await this.ajusteRepository.save({
            asistenciaId,
            usuarioId,
            campoModificado: campo,
            valorAnterior: valorAnterior.toString(),
            valorNuevo: valorNuevo.toString(),
            motivo,
            fechaHora: new Date(),
        });
        asistencia[campo] = valorNuevo;
        if (campo === 'hora_entrada_real' || campo === 'hora_salida_real') {
            if (asistencia.horaEntradaReal && asistencia.horaSalidaReal) {
                const horaEntrada = asistencia.horaEntradaReal instanceof Date
                    ? asistencia.horaEntradaReal
                    : new Date(asistencia.horaEntradaReal);
                const horaSalida = asistencia.horaSalidaReal instanceof Date
                    ? asistencia.horaSalidaReal
                    : new Date(asistencia.horaSalidaReal);
                asistencia.horasTrabajadas = this.calculateHours(horaEntrada, horaSalida);
            }
        }
        await this.asistenciaRepository.save(asistencia);
        await this.auditRepository.save({
            usuarioId,
            modulo: 'ASISTENCIA',
            accion: 'ADJUST',
            entidad: 'REGISTRO_ASISTENCIA',
            entidadId: asistenciaId,
            detalle: `Ajuste: ${campo}, de ${valorAnterior} a ${valorNuevo}, motivo: ${motivo}`,
        });
        return {
            message: 'Ajuste registrado correctamente',
            asistencia,
        };
    }
    async getTeamAttendance(supervisorId, fecha) {
        try {
            const empleadosRaw = await this.dataSource.query(`SELECT empleado_id, nombres, apellidos, codigo_empleado FROM EMPLEADO WHERE supervisor_id = @0 AND activo = 1`, [supervisorId]);
            if (empleadosRaw.length === 0) {
                return [];
            }
            const fechaBusqueda = fecha ? new Date(fecha) : new Date();
            fechaBusqueda.setHours(0, 0, 0, 0);
            const idsStr = empleadosRaw.map((e) => e.empleado_id).join(',');
            const registrosRaw = await this.dataSource.query(`SELECT asistencia_id, empleado_id, fecha, hora_entrada_real, hora_salida_real, minutos_tardia, horas_trabajadas, estado_jornada FROM REGISTRO_ASISTENCIA WHERE empleado_id IN (${idsStr}) AND fecha = @0`, [fechaBusqueda]);
            return empleadosRaw.map((emp) => {
                const registro = registrosRaw.find((r) => r.empleado_id === emp.empleado_id);
                return {
                    empleadoId: emp.empleado_id,
                    nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
                    codigoEmpleado: emp.codigo_empleado,
                    asistencia: registro
                        ? {
                            asistenciaId: registro.asistencia_id,
                            horaEntradaReal: registro.hora_entrada_real,
                            horaSalidaReal: registro.hora_salida_real,
                            minutosTardia: registro.minutos_tardia,
                            horasTrabajadas: registro.horas_trabajadas,
                            estadoJornada: registro.estado_jornada,
                        }
                        : null,
                };
            });
        }
        catch (error) {
            console.error('Error in getTeamAttendance:', error);
            throw error;
        }
    }
    getTimeFromString(timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, seconds || 0, 0);
        return date;
    }
    calculateHours(start, end) {
        const diff = end.getTime() - start.getTime();
        return Math.round((diff / 3600000) * 100) / 100;
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(registro_asistencia_entity_1.RegistroAsistencia)),
    __param(1, (0, typeorm_1.InjectRepository)(empleado_entity_1.Empleado)),
    __param(2, (0, typeorm_1.InjectRepository)(empleado_turno_entity_1.EmpleadoTurno)),
    __param(3, (0, typeorm_1.InjectRepository)(turno_entity_1.Turno)),
    __param(4, (0, typeorm_1.InjectRepository)(ajuste_asistencia_entity_1.AjusteAsistencia)),
    __param(5, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map