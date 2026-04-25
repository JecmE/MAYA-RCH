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
        br.dias_asistidos,
        br.dias_laborables,
        br.tardias_count,
        br.faltas_count,
        br.horas_count,
        br.motivo_no_elegible,
        e.nombres + ' ' + e.apellidos as nombreCompleto,
        e.departamento,
        rb.nombre as regla_nombre,
        rb.monto as monto_bono
      FROM BONO_RESULTADO br
      INNER JOIN EMPLEADO e ON br.empleado_id = e.empleado_id
      LEFT JOIN REGLA_BONO rb ON br.regla_bono_id = rb.regla_bono_id
      WHERE br.mes = @0 AND br.anio = @1
    `,
      [mes, anio],
    );

    return resultados.map((r) => ({
      empleadoId: r.empleado_id,
      nombreCompleto: this.sanitizeString(r.nombreCompleto),
      departamento: this.sanitizeString(r.departamento),
      reglaNombre: this.sanitizeString(r.regla_nombre) || 'Sin Bono',
      elegible: r.elegible,
      monto: r.monto_bono || 0,
      cumplimientoPct: r.cumplimiento_pct || 0,
      detalles: {
        asistencias: r.dias_asistidos || 0,
        laborables: r.dias_laborables || 0,
        tardias: r.tardias_count || 0,
        faltas: r.faltas_count || 0,
        horas: Number(r.horas_count || 0).toFixed(1)
      },
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

  async getMonthlyAttendance(mes: number, anio: number) { return []; }
  async getProjectHours(fi: string, ff: string) { return []; }
}
