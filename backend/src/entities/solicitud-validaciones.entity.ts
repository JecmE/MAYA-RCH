import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ParametroSistema } from './parametro-sistema.entity';

@Entity('SOLICITUD_VALIDACIONES')
export class SolicitudValidaciones {
  @PrimaryGeneratedColumn({ name: 'solicitud_validaciones_id' })
  solicitudValidacionesId: number;

  @Column({ name: 'parametro_id' })
  parametroId: number;

  @Column({ name: 'vac_min_dias_por_solicitud', nullable: true })
  vacMinDiasPorSolicitud: number;

  @Column({ name: 'vac_max_dias_por_solicitud', nullable: true })
  vacMaxDiasPorSolicitud: number;

  @Column({ name: 'vac_anticipacion_min_dias', nullable: true })
  vacAnticipacionMinDias: number;

  @Column({ name: 'vac_permite_medio_dia', nullable: true })
  vacPermiteMedioDia: boolean;

  @Column({ name: 'vac_permite_por_horas', nullable: true })
  vacPermitePorHoras: boolean;

  @Column({ name: 'vac_requiere_aprobacion_supervisor', nullable: true })
  vacRequiereAprobacionSupervisor: boolean;

  @ManyToOne(() => ParametroSistema)
  @JoinColumn({ name: 'parametro_id' })
  parametro: ParametroSistema;
}
