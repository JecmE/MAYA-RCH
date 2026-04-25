import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';
import { Empleado } from '../../entities/empleado.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(RegistroAsistencia)
    private asistenciaRepository: Repository<RegistroAsistencia>,
    @InjectRepository(SolicitudPermiso)
    private solicitudRepository: Repository<SolicitudPermiso>,
    @InjectRepository(RegistroTiempo)
    private tiempoRepository: Repository<RegistroTiempo>,
    @InjectRepository(KpiMensual)
    private kpiRepository: Repository<KpiMensual>,
    @InjectRepository(BonoResultado)
    private bonoRepository: Repository<BonoResultado>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    private dataSource: DataSource,
  ) {}

  async getBonusEligibility(mes: number, anio: number) {
    const resultados = await this.dataSource.query(
      `
      SELECT
        br.empleado_id,
        br.mes,
        br.anio,
        br.elegible,
        br.cumplimiento_pct,
        br.motivo_no_elegible,
        br.fecha_calculo,
        e.nombres + ' ' + e.apellidos as nombreCompleto,
        e.departamento,
        rb.nombre as regla_nombre,
        rb.monto as monto_bono
      FROM BONO_RESULTADO br
      INNER JOIN EMPLEADO e ON br.empleado_id = e.empleado_id
      INNER JOIN REGLA_BONO rb ON br.regla_bono_id = rb.regla_bono_id
      WHERE br.mes = @0 AND br.anio = @1
    `,
      [mes, anio],
    );

    return resultados.map((r) => ({
      empleadoId: r.empleado_id,
      nombreCompleto: this.sanitizeString(r.nombreCompleto),
      departamento: this.sanitizeString(r.departamento),
      reglaNombre: this.sanitizeString(r.regla_nombre),
      elegible: r.elegible,
      monto: r.monto_bono,
      cumplimientoPct: r.cumplimiento_pct,
      motivoNoElegible: this.sanitizeString(r.motivo_no_elegible),
      fechaCalculo: r.fecha_calculo,
    }));
  }

  private sanitizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str
      .replace(/Rodr\?guez/g, 'Rodríguez')
      .replace(/Mart\?nez/g, 'Martínez')
      .replace(/Fern\?ndez/g, 'Fernández')
      .replace(/Garc\?a/g, 'García')
      .replace(/L\?pez/g, 'López')
      .replace(/Tecnolog\?a/g, 'Tecnología')
      .replace(/Mart\?n/g, 'Martín')
      .replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ');
  }

  async getMonthlyAttendance(mes: number, anio: number) {
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0);
    return await this.dataSource.query(`SELECT ra.*, e.nombres FROM REGISTRO_ASISTENCIA ra INNER JOIN EMPLEADO e ON ra.empleado_id = e.empleado_id WHERE ra.fecha >= @0 AND ra.fecha <= @1`, [fechaInicio, fechaFin]);
  }

  async getProjectHours(fechaInicio: string, fechaFin: string) {
    return await this.dataSource.query(`SELECT rt.*, p.nombre as proyecto FROM REGISTRO_TIEMPO rt INNER JOIN PROYECTO p ON rt.proyecto_id = p.proyecto_id WHERE rt.fecha >= @0 AND rt.fecha <= @1`, [fechaInicio, fechaFin]);
  }
}
