import { Repository } from 'typeorm';
import { Turno } from '../../entities/turno.entity';
import { TipoPermiso } from '../../entities/tipo-permiso.entity';
import { ParametroSistema } from '../../entities/parametro-sistema.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Rol } from '../../entities/rol.entity';
import { ReglaBono } from '../../entities/regla-bono.entity';
export declare class AdminService {
    private turnoRepository;
    private tipoPermisoRepository;
    private parametroRepository;
    private auditRepository;
    private rolRepository;
    private reglaBonoRepository;
    constructor(turnoRepository: Repository<Turno>, tipoPermisoRepository: Repository<TipoPermiso>, parametroRepository: Repository<ParametroSistema>, auditRepository: Repository<AuditLog>, rolRepository: Repository<Rol>, reglaBonoRepository: Repository<ReglaBono>);
    getShifts(): Promise<{
        turnoId: number;
        nombre: string;
        horaEntrada: string;
        horaSalida: string;
        toleranciaMinutos: number;
        horasEsperadasDia: number;
    }[]>;
    createShift(createDto: any, usuarioId: number): Promise<{
        turnoId: number;
        nombre: string;
        horaEntrada: string;
        horaSalida: string;
        toleranciaMinutos: number;
        horasEsperadasDia: number;
    }[]>;
    updateShift(id: number, updateDto: any, usuarioId: number): Promise<{
        turnoId: number;
        nombre: string;
        horaEntrada: string;
        horaSalida: string;
        toleranciaMinutos: number;
        horasEsperadasDia: number;
    }[]>;
    deactivateShift(id: number, usuarioId: number): Promise<{
        message: string;
    }>;
    getKpiParameters(): Promise<any>;
    updateKpiParameters(updateDto: any, usuarioId: number): Promise<any>;
    getBonusRules(): Promise<{
        reglaBonoId: number;
        nombre: string;
        activo: boolean;
        minDiasTrabajados: number;
        maxTardias: number;
        maxFaltas: number;
        minHoras: number;
        vigenciaInicio: Date;
        vigenciaFin: Date;
    }[]>;
    createBonusRule(createDto: any, usuarioId: number): Promise<{
        reglaBonoId: number;
        nombre: string;
        activo: boolean;
        minDiasTrabajados: number;
        maxTardias: number;
        maxFaltas: number;
        minHoras: number;
        vigenciaInicio: Date;
        vigenciaFin: Date;
    }[]>;
    getAuditLogs(fechaInicio?: string, fechaFin?: string, usuarioId?: number, modulo?: string): Promise<{
        auditId: number;
        fechaHora: Date;
        usuario: string;
        modulo: string;
        accion: string;
        entidad: string;
        entidadId: number;
        detalle: string;
    }[]>;
    getRoles(): Promise<{
        rolId: number;
        nombre: string;
        descripcion: string;
    }[]>;
}
