import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SolicitudPermiso } from './solicitud-permiso.entity';

@Entity('ADJUNTO_SOLICITUD')
export class AdjuntoSolicitud {
  @PrimaryGeneratedColumn({ name: 'adjunto_id' })
  adjuntoId: number;

  @Column({ name: 'solicitud_id' })
  solicitudId: number;

  @Column({ name: 'nombre_archivo', length: 255 })
  nombreArchivo: string;

  @Column({ name: 'ruta_url', length: 500 })
  rutaUrl: string;

  @Column({ name: 'tipo_mime', length: 100 })
  tipoMime: string;

  @CreateDateColumn({ name: 'fecha_subida' })
  fechaSubida: Date;

  @ManyToOne(() => SolicitudPermiso, (sp) => sp.adjuntos)
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: SolicitudPermiso;
}
