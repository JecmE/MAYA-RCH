import { Empleado } from './empleado.entity';
import { Rol } from './rol.entity';
import { DecisionPermiso } from './decision-permiso.entity';
import { AjusteAsistencia } from './ajuste-asistencia.entity';
import { AuditLog } from './audit-log.entity';
import { AprobacionTiempo } from './aprobacion-tiempo.entity';
import { ResetPasswordToken } from './reset-password-token.entity';
export declare class Usuario {
    usuarioId: number;
    empleadoId: number;
    username: string;
    passwordHash: string;
    estado: string;
    ultimoLogin: Date;
    ultimoIp: string;
    sessionVersion: number;
    empleado: Empleado;
    roles: Rol[];
    decisionesPermiso: DecisionPermiso[];
    ajustes: AjusteAsistencia[];
    auditLogs: AuditLog[];
    aprobacionesTiempo: AprobacionTiempo[];
    resetPasswordTokens: ResetPasswordToken[];
    get isActivo(): boolean;
}
