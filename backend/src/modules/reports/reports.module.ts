import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';
import { Empleado } from '../../entities/empleado.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegistroAsistencia,
      SolicitudPermiso,
      RegistroTiempo,
      KpiMensual,
      BonoResultado,
      Empleado,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
