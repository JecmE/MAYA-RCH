import { ParametroSistema } from './parametro-sistema.entity';
export declare class SolicitudValidaciones {
    solicitudValidacionesId: number;
    parametroId: number;
    vacMinDiasPorSolicitud: number;
    vacMaxDiasPorSolicitud: number;
    vacAnticipacionMinDias: number;
    vacPermiteMedioDia: boolean;
    vacPermitePorHoras: boolean;
    vacRequiereAprobacionSupervisor: boolean;
    parametro: ParametroSistema;
}
