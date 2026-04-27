import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Raw } from 'typeorm';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { Empleado } from '../../entities/empleado.entity';
import { DataSource } from 'typeorm';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { ParametroSistema } from '../../entities/parametro-sistema.entity';

@Injectable()
export class KpiService {
  constructor(
    @InjectRepository(KpiMensual)
    private kpiRepository: Repository<KpiMensual>,
    @InjectRepository(RegistroAsistencia)
    private asistenciaRepository: Repository<RegistroAsistencia>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(SolicitudPermiso)
    private solicitudPermisoRepository: Repository<SolicitudPermiso>,
    @InjectRepository(RegistroTiempo)
    private registroTiempoRepository: Repository<RegistroTiempo>,
    @InjectRepository(Proyecto)
    private proyectoRepository: Repository<Proyecto>,
    @InjectRepository(ParametroSistema)
    private parametroRepository: Repository<ParametroSistema>,
    private dataSource: DataSource,
  ) {}

  private sanitizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str.replace(/Rodr\?guez/g, 'Rodríguez').replace(/Garc\?a/g, 'García').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á');
  }

  async getEmployeeDashboard(empleadoId: number, mes?: number, anio?: number) {
    const now = new Date();
    const month = mes || now.getMonth() + 1;
    const year = anio || now.getFullYear();

    let kpi = await this.kpiRepository.findOne({ where: { empleadoId, mes: month, anio: year } });

    // Si es el mes actual, siempre recalculamos para que los cambios de Admin se vean al instante
    if (!kpi || (month === now.getMonth() + 1 && year === now.getFullYear())) {
      kpi = await this.calculateKpi(empleadoId, month, year);
    }

    return {
      mes: month, anio: year,
      diasEsperados: kpi.diasEsperados, diasTrabajados: kpi.diasTrabajados,
      tardias: kpi.tardias, faltas: kpi.faltas,
      horasEsperadas: kpi.horasEsperadas, horasTrabajadas: kpi.horasTrabajadas,
      cumplimientoPct: kpi.cumplimientoPct, clasificacion: kpi.clasificacion,
      observacion: kpi.observacion,
    };
  }

  private async getKpiThresholds() {
    const params = await this.parametroRepository.find({
      where: { clave: In(['kpi_excelente', 'kpi_bueno', 'kpi_regular', 'max_tardias']), activo: true }
    });
    const map = new Map(params.map(p => [p.clave, p.valor]));
    return {
      excelente: Number(map.get('kpi_excelente') || 95),
      bueno: Number(map.get('kpi_bueno') || 80),
      regular: Number(map.get('kpi_regular') || 65),
      maxTardias: Number(map.get('max_tardias') || 4)
    };
  }

  private async calculateKpi(empleadoId: number, mes: number, anio: number): Promise<KpiMensual> {
    const thresholds = await this.getKpiThresholds();
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0);
    const hoy = new Date();
    const fechaCorte = (hoy.getMonth() + 1 === mes && hoy.getFullYear() === anio) ? hoy : fechaFin;

    const empleadoTurno = await this.dataSource.getRepository('EMPLEADO_TURNO').findOne({
      where: { empleadoId, activo: true }, relations: ['turno'], order: { fechaInicio: 'DESC' }
    });

    const diasLaborales = empleadoTurno?.turno?.dias?.split(',') || ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
    const horasPorDia = Number(empleadoTurno?.turno?.horasEsperadasDia) || 8;
    const diasSemanaMap: { [key: number]: string } = { 1: 'Lun', 2: 'Mar', 3: 'Mie', 4: 'Jue', 5: 'Vie', 6: 'Sab', 0: 'Dom' };

    let diasEsperados = 0;
    const temp = new Date(fechaInicio);
    while (temp <= fechaCorte) {
      if (diasLaborales.includes(diasSemanaMap[temp.getDay()])) diasEsperados++;
      temp.setDate(temp.getDate() + 1);
    }

    const horasEsperadas = diasEsperados * horasPorDia;
    const asistencias = await this.asistenciaRepository.find({ where: { empleadoId, fecha: Between(fechaInicio, fechaCorte) } });

    const diasTrabajados = asistencias.filter(a => a.horaEntradaReal !== null).length;
    const tardias = asistencias.reduce((sum, a) => sum + (a.minutosTardia > 0 ? 1 : 0), 0);
    const horasTrabajadas = asistencias.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);
    const cumplimientoPct = horasEsperadas > 0 ? (horasTrabajadas / horasEsperadas) * 100 : 0;

    let clasificacion = 'En Riesgo';

    // Regla de Oro: Faltas o tardías excesivas bajan a riesgo inmediatamente
    const faltas = Math.max(0, diasEsperados - diasTrabajados);

    if (faltas > 0 || tardias > thresholds.maxTardias) {
        clasificacion = 'En Riesgo';
    } else if (cumplimientoPct >= thresholds.excelente) {
        clasificacion = 'Excelente';
    } else if (cumplimientoPct >= thresholds.bueno) {
        clasificacion = 'Bueno';
    } else if (cumplimientoPct >= thresholds.regular) {
        clasificacion = 'Regular';
    } else {
        clasificacion = 'En Riesgo';
    }

    let kpi = await this.kpiRepository.findOne({ where: { empleadoId, mes, anio } });
    const data = {
        empleadoId, anio, mes, diasEsperados, diasTrabajados, tardias, faltas,
        horasEsperadas, horasTrabajadas, cumplimientoPct: Math.round(cumplimientoPct * 100) / 100,
        clasificacion, fechaCalculo: new Date()
    };

    if (kpi) Object.assign(kpi, data);
    else kpi = this.kpiRepository.create(data);

    return this.kpiRepository.save(kpi);
  }

  // MÉTODO PARA RECALCULAR TODO EL MES (LLAMADO DESDE ADMIN)
  async globalRecalculateCurrentMonth() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const empleados = await this.empleadoRepository.find({ where: { activo: true } });

    for (const emp of empleados) {
        await this.calculateKpi(emp.empleadoId, month, year);
    }
  }

  async getSupervisorDashboard(supervisorEmpleadoId: number, mes?: number, anio?: number) {
    const now = new Date();
    const month = mes || now.getMonth() + 1;
    const year = anio || now.getFullYear();
    const equipo = await this.empleadoRepository.find({ where: { supervisorId: supervisorEmpleadoId, activo: true } });
    if (equipo.length === 0) return { mes: month, anio: year, cantidadEmpleados: 0, resumen: { totalDiasTrabajados: 0, totalTardias: 0, promedioCumplimiento: 0 }, empleados: [] };
    const ids = equipo.map(e => e.empleadoId);
    const kpis = await this.kpiRepository.find({ where: { empleadoId: In(ids), mes: month, anio: year } });
    return {
      mes: month, anio: year, cantidadEmpleados: equipo.length,
      resumen: {
          totalDiasTrabajados: kpis.reduce((sum, k) => sum + k.diasTrabajados, 0),
          totalTardias: kpis.reduce((sum, k) => sum + k.tardias, 0),
          promedioCumplimiento: kpis.length > 0 ? kpis.reduce((sum, k) => sum + Number(k.cumplimientoPct), 0) / kpis.length : 0
      },
      empleados: equipo.map(e => {
        const k = kpis.find(x => x.empleadoId === e.empleadoId);
        return { empleadoId: e.empleadoId, nombreCompleto: this.sanitizeString(`${e.nombres} ${e.apellidos}`), diasEsperados: k?.diasEsperados || 0, cumplimientoPct: k?.cumplimientoPct || 0, clasificacion: k?.clasificacion || 'Sin datos' };
      }),
    };
  }

  async getHrDashboard(mes?: number, anio?: number) {
    const month = mes || new Date().getMonth() + 1;
    const year = anio || new Date().getFullYear();
    const kpis = await this.kpiRepository.find({ where: { mes: month, anio: year } });
    return {
      mes: month, anio: year, totalEmpleados: kpis.length,
      promedioCumplimiento: kpis.length > 0 ? kpis.reduce((sum, k) => sum + Number(k.cumplimientoPct), 0) / kpis.length : 0,
      totalTardias: kpis.reduce((sum, k) => sum + k.tardias, 0),
      totalFaltas: kpis.reduce((sum, k) => sum + k.faltas, 0),
      clasificaciones: {
          Excelente: kpis.filter(k => k.clasificacion === 'Excelente').length,
          Bueno: kpis.filter(k => k.clasificacion === 'Bueno').length,
          Regular: kpis.filter(k => k.clasificacion === 'Regular').length,
          'En Riesgo': kpis.filter(k => k.clasificacion === 'En Riesgo').length
      },
    };
  }

  async getEmployeeClassification(empleadoId: number, mes?: number, anio?: number) {
    const month = mes || new Date().getMonth() + 1;
    const year = anio || new Date().getFullYear();
    const kpi = await this.calculateKpi(empleadoId, month, year);
    return [{ empleadoId, clasificacion: kpi.clasificacion, cumplimientoPct: kpi.cumplimientoPct }];
  }

  async refreshEmployeeKpi(empleadoId: number, mes?: number, anio?: number): Promise<KpiMensual> {
    const month = mes || new Date().getMonth() + 1;
    const year = anio || new Date().getFullYear();
    return this.calculateKpi(empleadoId, month, year);
  }

  async getEmployeeProfile(empleadoId: number) {
    const empleado = await this.empleadoRepository.findOne({ where: { empleadoId } });
    if (!empleado) return null;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentKpi = await this.kpiRepository.findOne({ where: { empleadoId, mes: currentMonth, anio: currentYear } });
    return {
      empleado: { nombreCompleto: this.sanitizeString(`${empleado.nombres} ${empleado.apellidos}`), puesto: this.sanitizeString(empleado.puesto), departamento: this.sanitizeString(empleado.departamento), email: empleado.email },
      kpiActual: currentKpi ? { cumplimientoPct: currentKpi.cumplimientoPct, clasificacion: currentKpi.clasificacion, tardias: currentKpi.tardias, faltas: currentKpi.faltas } : null,
    };
  }

  async saveObservation(empleadoId: number, mes: number, anio: number, observacion: string) {
    const kpi = await this.kpiRepository.findOne({ where: { empleadoId, mes, anio } });
    if (!kpi) throw new NotFoundException('Sin KPI calculado');
    kpi.observacion = observacion;
    return this.kpiRepository.save(kpi);
  }
}
