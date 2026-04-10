import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { SolicitudPermiso } from './solicitud-permiso.entity';

@Entity('TIPO_PERMISO')
export class TipoPermiso {
  @PrimaryGeneratedColumn({ name: 'tipo_permiso_id' })
  tipoPermisoId: number;

  @Column({ length: 50 })
  nombre: string;

  @Column({ name: 'requiere_documento', default: 0 })
  requiereDocumento: boolean;

  @Column({ name: 'descuenta_vacaciones', default: 0 })
  descuentaVacaciones: boolean;

  @Column({ default: 1 })
  activo: boolean;

  @OneToMany(() => SolicitudPermiso, (sp) => sp.tipoPermiso)
  solicitudes: SolicitudPermiso[];
}
