import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { Empleado } from '../../entities/empleado.entity';
import { ParametroSistema } from '../../entities/parametro-sistema.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { Proyecto } from '../../entities/proyecto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KpiMensual,
      RegistroAsistencia,
      Empleado,
      ParametroSistema,
      AuditLog,
      SolicitudPermiso,
      RegistroTiempo,
      Proyecto,
    ]),
  ],
  controllers: [KpiController],
  providers: [KpiService],
  exports: [KpiService],
})
export class KpiModule {}
