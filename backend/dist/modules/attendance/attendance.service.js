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
const kpi_service_1 = require("../kpi/kpi.service");
let AttendanceService = class AttendanceService {
    constructor(asistenciaRepository, empleadoRepository, empleadoTurnoRepository, turnoRepository, ajusteRepository, auditRepository, dataSource, kpiService) {
        this.asistenciaRepository = asistenciaRepository;
        this.empleadoRepository = empleadoRepository;
        this.empleadoTurnoRepository = empleadoTurnoRepository;
        this.turnoRepository = turnoRepository;
        this.ajusteRepository = ajusteRepository;
        this.auditRepository = auditRepository;
        this.dataSource = dataSource;
        this.kpiService = kpiService;
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
        const empleadoTurno = await this.getShiftForDate(empleadoId, today);
        if (!empleadoTurno) {
            throw new common_1.BadRequestException('No tiene turno asignado para hoy');
        }
        const turno = empleadoTurno.turno;
        const now = new Date();
        const diasSemanaMap = {
            1: 'Lun', 2: 'Mar', 3: 'Mie', 4: 'Jue', 5: 'Vie', 6: 'Sab', 0: 'Dom'
        };
        const hoyNombre = diasSemanaMap[now.getDay()];
        const diasPermitidos = turno.dias ? turno.dias.split(',') : ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
        if (!diasPermitidos.includes(hoyNombre)) {
            throw new common_1.BadRequestException(`Hoy (${hoyNombre}) no es un día laborable según tu turno (${turno.nombre}).`);
        }
        const horaEntradaEsperada = this.getTimeFromString(turno.horaEntrada);
        const horaEntradaMin = new Date(now);
        horaEntradaMin.setHours(horaEntradaEsperada.getHours(), horaEntradaEsperada.getMinutes() - 30, 0, 0);
        const horaEntradaMax = new Date(horaEntradaEsperada);
        horaEntradaMax.setMinutes(horaEntradaMax.getMinutes() + turno.toleranciaMinutos);
        if (now < horaEntradaMin) {
            throw new common_1.BadRequestException(`Aún no puedes marcar entrada. Puedes hacerlo a partir de las ${this.formatTimeToString(horaEntradaMin)}`);
        }
        if (now > horaEntradaMax) {
            throw new common_1.BadRequestException(`Ya no puedes marcar entrada. La hora máxima fue las ${this.formatTimeToString(horaEntradaMax)}`);
        }
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
            return { message: 'Entrada registrada', asistencia: existing, minutosTardia };
        }
        const asistencia = this.asistenciaRepository.create({
            empleadoId,
            empleadoTurnoId: empleadoTurno.empleadoTurnoId,
            fecha: today,
            horaEntradaReal: now,
            minutosTardia,
            estadoJornada: registro_asistencia_entity_1.RegistroAsistencia.ESTADO_INCOMPLETA,
        });
        const saved = await this.asistenciaRepository.save(asistencia);
        await this.kpiService.refreshEmployeeKpi(empleadoId);
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
        const empleadoTurno = await this.getShiftForDate(empleadoId, today);
        if (!empleadoTurno) {
            throw new common_1.BadRequestException('No tiene turno asignado');
        }
        const now = new Date();
        asistencia.horaSalidaReal = now;
        asistencia.estadoJornada = registro_asistencia_entity_1.RegistroAsistencia.ESTADO_COMPLETADA;
        asistencia.horasTrabajadas = this.calculateHours(asistencia.horaEntradaReal, now);
        await this.asistenciaRepository.save(asistencia);
        await this.kpiService.refreshEmployeeKpi(empleadoId);
        return { message: 'Salida registrada', asistencia };
    }
    async getShiftForDate(empleadoId, date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return await this.empleadoTurnoRepository.findOne({
            where: {
                empleadoId,
                activo: true,
                fechaInicio: (0, typeorm_2.LessThanOrEqual)(d)
            },
            relations: ['turno'],
            order: { fechaInicio: 'DESC', empleadoTurnoId: 'DESC' }
        });
    }
    async getTodayStatus(empleadoId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const asistencia = await this.asistenciaRepository.findOne({
            where: { empleadoId, fecha: today },
        });
        const empleadoTurno = await this.getShiftForDate(empleadoId, today);
        const turnoNombre = empleadoTurno?.turno?.nombre || 'Sin turno';
        const toleranciaMinutos = empleadoTurno?.turno?.toleranciaMinutos || 0;
        const horaEntradaTurno = empleadoTurno?.turno?.horaEntrada || null;
        const horaSalidaTurno = empleadoTurno?.turno?.horaSalida || null;
        const diasSemanaMap = {
            1: 'Lun', 2: 'Mar', 3: 'Mie', 4: 'Jue', 5: 'Vie', 6: 'Sab', 0: 'Dom'
        };
        const hoyNombre = diasSemanaMap[today.getDay()];
        const diasPermitidos = empleadoTurno?.turno?.dias ? empleadoTurno.turno.dias.split(',') : ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
        const esDiaLaboral = empleadoTurno ? diasPermitidos.includes(hoyNombre) : false;
        if (!asistencia) {
            return {
                estadoJornada: esDiaLaboral ? 'sin_registro' : 'no_laboral',
                fecha: today,
                tieneEntrada: false,
                tieneSalida: false,
                turnoNombre,
                toleranciaMinutos,
                horaEntradaTurno,
                horaSalidaTurno,
                mensajeEstado: esDiaLaboral ? '' : `Hoy (${hoyNombre}) no es un día laborable para tu turno.`
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
            horaEntradaTurno,
            horaSalidaTurno,
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
        let asistencia;
        const parsePura = (s) => {
            const [y, m, d] = s.split('-').map(Number);
            return new Date(y, m - 1, d);
        };
        const fechaReferencia = parsePura(adjustDto.fecha);
        if (asistenciaId === 0) {
            asistencia = await this.asistenciaRepository.findOne({
                where: { empleadoId: adjustDto.empleadoId, fecha: fechaReferencia },
            });
            if (!asistencia) {
                asistencia = this.asistenciaRepository.create({
                    empleadoId: adjustDto.empleadoId,
                    fecha: fechaReferencia,
                    estadoJornada: registro_asistencia_entity_1.RegistroAsistencia.ESTADO_INCOMPLETA,
                    observacion: 'Registro creado por ajuste manual'
                });
            }
        }
        else {
            asistencia = await this.asistenciaRepository.findOne({ where: { asistenciaId } });
        }
        if (!asistencia) {
            throw new common_1.NotFoundException('No se pudo localizar el registro de asistencia');
        }
        const { campo, valorNuevo, motivo } = adjustDto;
        const valorAnterior = asistencia[campo] || 'Sin registro';
        if (campo === 'horaEntradaReal' || campo === 'horaSalidaReal') {
            const [hours, minutes] = valorNuevo.split(':').map(Number);
            const newTime = new Date(asistencia.fecha);
            newTime.setHours(hours, minutes, 0, 0);
            asistencia[campo] = newTime;
            if (campo === 'horaEntradaReal') {
                const shift = await this.getShiftForDate(asistencia.empleadoId, asistencia.fecha);
                if (shift && shift.turno) {
                    const expectedIn = this.getTimeFromString(shift.turno.horaEntrada);
                    const actualIn = new Date(asistencia.horaEntradaReal);
                    if (actualIn > expectedIn) {
                        const diffMin = Math.floor((actualIn.getTime() - expectedIn.getTime()) / 60000);
                        asistencia.minutosTardia = Math.max(0, diffMin - shift.turno.toleranciaMinutos);
                    }
                    else {
                        asistencia.minutosTardia = 0;
                    }
                }
            }
        }
        if (asistencia.horaEntradaReal && asistencia.horaSalidaReal) {
            asistencia.horasTrabajadas = this.calculateHours(asistencia.horaEntradaReal, asistencia.horaSalidaReal);
            asistencia.estadoJornada = registro_asistencia_entity_1.RegistroAsistencia.ESTADO_COMPLETADA;
        }
        const saved = await this.asistenciaRepository.save(asistencia);
        await this.ajusteRepository.save({
            asistenciaId: saved.asistenciaId,
            usuarioId,
            campoModificado: campo,
            valorAnterior: valorAnterior instanceof Date ? this.formatTimeToString(valorAnterior) : valorAnterior.toString(),
            valorNuevo: valorNuevo.toString(),
            motivo,
            fechaHora: new Date(),
        });
        return { message: 'Ajuste registrado correctamente', asistencia: saved };
    }
    async getTeamAttendance(supervisorId, fecha) {
        try {
            const equipo = await this.empleadoRepository.find({
                where: { supervisorId, activo: true },
            });
            if (equipo.length === 0) {
                return [];
            }
            const fechaBusqueda = fecha ? new Date(fecha) : new Date();
            fechaBusqueda.setHours(0, 0, 0, 0);
            const empleadoIds = equipo.map((e) => e.empleadoId);
            const registros = await this.asistenciaRepository.find({
                where: {
                    empleadoId: (0, typeorm_2.In)(empleadoIds),
                    fecha: fechaBusqueda,
                },
            });
            return equipo.map((emp) => {
                const registro = registros.find((r) => r.empleadoId === emp.empleadoId);
                return {
                    empleadoId: emp.empleadoId,
                    nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
                    codigoEmpleado: emp.codigoEmpleado,
                    departamento: this.sanitizeString(emp.departamento) || 'Sin asignar',
                    puesto: this.sanitizeString(emp.puesto) || 'Empleado',
                    asistencia: registro
                        ? {
                            asistenciaId: registro.asistenciaId,
                            horaEntradaReal: registro.horaEntradaReal,
                            horaSalidaReal: registro.horaSalidaReal,
                            minutosTardia: registro.minutosTardia,
                            horasTrabajadas: registro.horasTrabajadas,
                            estadoJornada: registro.estadoJornada,
                            observacion: registro.observacion,
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
    async getAllAttendance(fechaInicio, fechaFin) {
        try {
            const startISO = fechaInicio;
            const endISO = fechaFin || fechaInicio;
            const parseLocalSafe = (s) => {
                const [y, m, d] = s.split('-').map(Number);
                return new Date(y, m - 1, d, 12, 0, 0);
            };
            const startDate = parseLocalSafe(startISO);
            const endDate = parseLocalSafe(endISO);
            const timeDiff = endDate.getTime() - startDate.getTime();
            const daysCount = Math.round(timeDiff / (1000 * 3600 * 24)) + 1;
            const rangeISODates = [];
            const limit = daysCount > 31 ? 31 : daysCount;
            for (let i = 0; i < limit; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                rangeISODates.push(d.toISOString().split('T')[0]);
            }
            const empleados = await this.empleadoRepository.find({
                where: { activo: true },
                relations: ['empleadoTurnos', 'empleadoTurnos.turno']
            });
            const asistencias = await this.asistenciaRepository.find({
                where: {
                    fecha: (0, typeorm_2.Between)(new Date(startISO + 'T00:00:00'), new Date(endISO + 'T23:59:59'))
                }
            });
            const results = [];
            for (const isoDate of rangeISODates) {
                for (const emp of empleados) {
                    const asistencia = asistencias.find(a => {
                        const dbDateISO = new Date(a.fecha).toISOString().split('T')[0];
                        return a.empleadoId === emp.empleadoId && dbDateISO === isoDate;
                    });
                    const turnosEnFecha = emp.empleadoTurnos?.filter(et => {
                        const tStart = new Date(et.fechaInicio).toISOString().split('T')[0];
                        const tEnd = et.fechaFin ? new Date(et.fechaFin).toISOString().split('T')[0] : null;
                        return isoDate >= tStart && (!tEnd || isoDate <= tEnd);
                    }) || [];
                    const turnoAsignado = turnosEnFecha.sort((a, b) => {
                        if (a.activo !== b.activo)
                            return a.activo ? -1 : 1;
                        return b.empleadoTurnoId - a.empleadoTurnoId;
                    })[0];
                    results.push({
                        empleadoId: emp.empleadoId,
                        nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
                        codigoEmpleado: emp.codigoEmpleado,
                        departamento: this.sanitizeString(emp.departamento),
                        fecha: isoDate,
                        turno: turnoAsignado?.turno?.nombre || 'Sin turno',
                        asistencia: asistencia ? {
                            asistenciaId: asistencia.asistenciaId,
                            horaEntradaReal: asistencia.horaEntradaReal,
                            horaSalidaReal: asistencia.horaSalidaReal,
                            minutosTardia: asistencia.minutosTardia,
                            horasTrabajadas: asistencia.horasTrabajadas,
                            estadoJornada: asistencia.estadoJornada,
                            observacion: asistencia.observacion
                        } : null
                    });
                }
            }
            return results;
        }
        catch (error) {
            console.error('Error in getAllAttendance:', error);
            throw error;
        }
    }
    async getAdjustmentHistory() {
        return this.ajusteRepository.find({
            relations: ['asistencia', 'asistencia.empleado', 'usuario'],
            order: { fechaHora: 'DESC' },
            take: 200
        });
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
    formatTimeToString(date) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? 'p. m.' : 'a. m.';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
    }
    getTimeFromString(timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, seconds || 0, 0);
        return date;
    }
    calculateHours(start, end) {
        const dStart = new Date(start);
        const dEnd = new Date(end);
        let diff = dEnd.getTime() - dStart.getTime();
        if (diff < 0) {
            diff += 24 * 60 * 60 * 1000;
        }
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
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => kpi_service_1.KpiService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        kpi_service_1.KpiService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map