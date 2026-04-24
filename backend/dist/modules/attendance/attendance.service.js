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
        const empleadoTurno = await this.empleadoTurnoRepository.findOne({
            where: {
                empleadoId,
                activo: true,
                fechaInicio: (0, typeorm_2.LessThanOrEqual)(today)
            },
            relations: ['turno'],
            order: { fechaInicio: 'DESC', empleadoTurnoId: 'DESC' }
        });
        if (!empleadoTurno) {
            throw new common_1.BadRequestException('No tiene turno asignado');
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
        const horaSalidaEsperada = this.getTimeFromString(turno.horaSalida);
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
        const empleadoTurno = await this.empleadoTurnoRepository.findOne({
            where: {
                empleadoId,
                activo: true,
                fechaInicio: (0, typeorm_2.LessThanOrEqual)(today)
            },
            relations: ['turno'],
            order: { fechaInicio: 'DESC', empleadoTurnoId: 'DESC' }
        });
        if (!empleadoTurno) {
            throw new common_1.BadRequestException('No tiene turno asignado');
        }
        const turno = empleadoTurno.turno;
        const now = new Date();
        const horaSalidaEsperada = this.getTimeFromString(turno.horaSalida);
        const horaSalidaPermitida = new Date(now);
        horaSalidaPermitida.setHours(horaSalidaEsperada.getHours(), horaSalidaEsperada.getMinutes(), 0, 0);
        if (now < horaSalidaPermitida) {
            throw new common_1.BadRequestException(`Aún no puedes marcar salida. Puedes hacerlo a partir de las ${this.formatTimeToString(horaSalidaPermitida)}`);
        }
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
        await this.kpiService.refreshEmployeeKpi(empleadoId);
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
            where: {
                empleadoId,
                activo: true,
                fechaInicio: (0, typeorm_2.LessThanOrEqual)(today)
            },
            relations: ['turno'],
            order: { fechaInicio: 'DESC', empleadoTurnoId: 'DESC' }
        });
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
                    nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
                    codigoEmpleado: emp.codigoEmpleado,
                    departamento: emp.departamento || 'Sin asignar',
                    puesto: emp.puesto || 'Empleado',
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
    async getAllAttendance(fecha) {
        try {
            const searchDate = fecha ? new Date(fecha) : new Date();
            searchDate.setHours(0, 0, 0, 0);
            const empleados = await this.empleadoRepository.find({
                where: { activo: true },
                relations: ['empleadoTurnos', 'empleadoTurnos.turno']
            });
            const asistencias = await this.asistenciaRepository.find({
                where: {
                    fecha: searchDate
                }
            });
            return empleados.map(emp => {
                const asistencia = asistencias.find(a => a.empleadoId === emp.empleadoId);
                const turnoAsignado = emp.empleadoTurnos?.find(et => {
                    const inicio = new Date(et.fechaInicio);
                    const fin = et.fechaFin ? new Date(et.fechaFin) : null;
                    return searchDate >= inicio && (!fin || searchDate <= fin);
                });
                return {
                    empleadoId: emp.empleadoId,
                    nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
                    codigoEmpleado: emp.codigoEmpleado,
                    departamento: this.sanitizeString(emp.departamento),
                    puesto: this.sanitizeString(emp.puesto),
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
                };
            });
        }
        catch (error) {
            console.error('Error in getAllAttendance:', error);
            throw error;
        }
    }
    sanitizeString(str) {
        if (!str)
            return '';
        let res = str
            .replace(/\?/g, (match, offset, original) => {
            if (original.includes('Rodr'))
                return 'í';
            if (original.includes('Mart'))
                return 'í';
            if (original.includes('Garc'))
                return 'í';
            if (original.includes('Fern'))
                return 'á';
            return 'í';
        })
            .replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á')
            .replace(/Ã©/g, 'é').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ');
        const words = res.trim().split(/\s+/);
        const finalWords = [];
        const seenSet = new Set();
        for (const word of words) {
            const normalized = word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (!seenSet.has(normalized)) {
                finalWords.push(word);
                seenSet.add(normalized);
            }
        }
        return finalWords.join(' ');
    }
    getTimeFromString(timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, seconds || 0, 0);
        return date;
    }
    formatTimeToString(date) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? 'p. m.' : 'a. m.';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
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