import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  DataSource,
  Like,
  Not,
  MoreThanOrEqual,
  MoreThan,
} from 'typeorm';
import { Turno } from '../../entities/turno.entity';
import { EmpleadoTurno } from '../../entities/empleado-turno.entity';
import { TipoPermiso } from '../../entities/tipo-permiso.entity';
import { ParametroSistema } from '../../entities/parametro-sistema.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Rol } from '../../entities/rol.entity';
import { ReglaBono } from '../../entities/regla-bono.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Empleado } from '../../entities/empleado.entity';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { RegistroAsistencia } from '../../entities/registro-asistencia.entity';
import { KpiMensual } from '../../entities/kpi-mensual.entity';
import { VacacionMovimiento } from '../../entities/vacacion-movimiento.entity';
import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { BonoResultado } from '../../entities/bono-resultado.entity';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
    @InjectRepository(EmpleadoTurno)
    private empleadoTurnoRepository: Repository<EmpleadoTurno>,
    @InjectRepository(TipoPermiso)
    private tipoPermisoRepository: Repository<TipoPermiso>,
    @InjectRepository(ParametroSistema)
    private parametroRepository: Repository<ParametroSistema>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
    @InjectRepository(ReglaBono)
    private reglaBonoRepository: Repository<ReglaBono>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(SolicitudPermiso)
    private solicitudPermisoRepository: Repository<SolicitudPermiso>,
    @InjectRepository(RegistroAsistencia)
    private registroAsistenciaRepository: Repository<RegistroAsistencia>,
    @InjectRepository(KpiMensual)
    private kpiMensualRepository: Repository<KpiMensual>,
    @InjectRepository(VacacionMovimiento)
    private vacacionMovimientoRepository: Repository<VacacionMovimiento>,
    @InjectRepository(RegistroTiempo)
    private registroTiempoRepository: Repository<RegistroTiempo>,
    @InjectRepository(BonoResultado)
    private bonoResultadoRepository: Repository<BonoResultado>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.ensureCorrectTableStructures();
  }

  private async ensureCorrectTableStructures() {
    try {
      // 1. Asegurar columna monto en REGLA_BONO
      await this.dataSource.query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[REGLA_BONO]') AND name = 'monto')
        BEGIN
            ALTER TABLE [dbo].[REGLA_BONO] ADD [monto] DECIMAL(10, 2) DEFAULT 0;
        END
      `);

      // 2. Corregir Tabla BONO_RESULTADO
      const checkPK = await this.dataSource.query(`
        SELECT name FROM sys.columns
        WHERE object_id = OBJECT_ID(N'[dbo].[BONO_RESULTADO]')
        AND name = 'bono_resultado_id'
      `);

      if (checkPK.length === 0) {
        console.log('🔄 Reconstruyendo tabla BONO_RESULTADO para sincronizar columnas...');
        await this.dataSource.query(`IF OBJECT_ID(N'[dbo].[BONO_RESULTADO]', N'U') IS NOT NULL DROP TABLE [dbo].[BONO_RESULTADO]`);
        await this.dataSource.query(`
          CREATE TABLE [dbo].[BONO_RESULTADO] (
            [bono_resultado_id] INT IDENTITY(1,1) PRIMARY KEY,
            [empleado_id] INT NOT NULL,
            [regla_bono_id] INT NOT NULL,
            [mes] INT NOT NULL,
            [anio] INT NOT NULL,
            [elegible] BIT DEFAULT 0,
            [cumplimiento_pct] DECIMAL(5, 2) DEFAULT 0,
            [motivo_no_elegible] NVARCHAR(255),
            [fecha_calculo] DATETIME DEFAULT GETDATE(),
            CONSTRAINT FK_BONO_EMP FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id),
            CONSTRAINT FK_BONO_REGLA FOREIGN KEY (regla_bono_id) REFERENCES REGLA_BONO(regla_bono_id)
          )
        `);
      }
    } catch (e) {}
  }

  // Métodos de Turnos
  async getShifts() {
    return await this.turnoRepository.find({ order: { nombre: 'ASC' } });
  }

  async createShift(createDto: any, usuarioId: number) {
    const turno = this.turnoRepository.create(createDto);
    const saved = await this.turnoRepository.save(turno);
    const s = Array.isArray(saved) ? saved[0] : saved;

    await this.auditRepository.save({
      usuarioId, modulo: 'ADMIN', accion: 'CREATE',
      entidad: 'TURNO', entidadId: s.turnoId,
      detalle: `Turno creado: ${s.nombre}`,
    });
    return this.getShifts();
  }

  async updateShift(id: number, updateDto: any, usuarioId: number) {
    const turno = await this.turnoRepository.findOne({ where: { turnoId: id } });
    if (!turno) throw new NotFoundException('Turno no encontrado');
    Object.assign(turno, updateDto);
    await this.turnoRepository.save(turno);

    await this.auditRepository.save({
      usuarioId, modulo: 'ADMIN', accion: 'UPDATE',
      entidad: 'TURNO', entidadId: id,
      detalle: `Turno actualizado: ${turno.nombre}`,
    });
    return this.getShifts();
  }

  async deactivateShift(id: number, usuarioId: number) {
    const turno = await this.turnoRepository.findOne({ where: { turnoId: id } });
    if (!turno) throw new NotFoundException('Turno no encontrado');
    turno.activo = false;
    await this.turnoRepository.save(turno);

    await this.auditRepository.save({
      usuarioId, modulo: 'ADMIN', accion: 'DEACTIVATE',
      entidad: 'TURNO', entidadId: id,
      detalle: `Turno desactivado: ${turno.nombre}`,
    });
    return { message: 'Desactivado' };
  }

  // Métodos de Reglas de Bono
  async getBonusRules() {
    return await this.reglaBonoRepository.find({ order: { monto: 'DESC' } });
  }

  async createBonusRule(createDto: any, usuarioId: number) {
    const regla = this.reglaBonoRepository.create(createDto);
    const saved = await this.reglaBonoRepository.save(regla);
    const r = Array.isArray(saved) ? saved[0] : saved;

    await this.auditRepository.save({
      usuarioId, modulo: 'ADMIN', accion: 'CREATE_BONUS_RULE',
      entidad: 'REGLA_BONO', entidadId: r.reglaBonoId,
      detalle: `Regla creada: ${r.nombre}`,
    });
    return this.getBonusRules();
  }

  async updateBonusRule(id: number, updateDto: any, usuarioId: number) {
    const regla = await this.reglaBonoRepository.findOne({ where: { reglaBonoId: id } });
    if (!regla) throw new NotFoundException('No encontrado');
    Object.assign(regla, updateDto);
    await this.reglaBonoRepository.save(regla);

    await this.auditRepository.save({
      usuarioId, modulo: 'ADMIN', accion: 'UPDATE_BONUS_RULE',
      entidad: 'REGLA_BONO', entidadId: id,
      detalle: `Regla actualizada: ${regla.nombre}`,
    });
    return this.getBonusRules();
  }

  async deleteBonusRule(id: number, usuarioId: number) {
    const regla = await this.reglaBonoRepository.findOne({ where: { reglaBonoId: id } });
    if (!regla) throw new NotFoundException('No encontrado');
    regla.activo = false;
    await this.reglaBonoRepository.save(regla);
    return this.getBonusRules();
  }

  // Evaluación de Bonos
  async runBonusEvaluation(mes: number, anio: number, usuarioId: number) {
    const reglas = await this.reglaBonoRepository.find({
      where: { activo: true },
      order: { monto: 'DESC', minDiasTrabajados: 'DESC' }
    });

    const empleados = await this.empleadoRepository.find({ where: { activo: true } });

    // Si no hay reglas, limpiamos los resultados de ese mes
    if (reglas.length === 0) {
      await this.bonoResultadoRepository.delete({ mes, anio });
      return { message: 'Todos los bonos han sido desactivados al no haber reglas vigentes.' };
    }

    const today = new Date();
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = (mes === today.getMonth() + 1 && anio === today.getFullYear()) ? today : new Date(anio, mes, 0);

    let diasLaborables = 0;
    const temp = new Date(fechaInicio);
    while(temp <= fechaFin) {
      if (temp.getDay() !== 0 && temp.getDay() !== 6) diasLaborables++;
      temp.setDate(temp.getDate() + 1);
    }

    for (const emp of empleados) {
      const asistencias = await this.registroAsistenciaRepository.find({
        where: { empleadoId: emp.empleadoId, fecha: Between(fechaInicio, fechaFin) as any }
      });

      const totalDiasAsistidos = asistencias.length;
      const totalTardias = asistencias.filter(a => a.minutosTardia > 0).length;
      const totalFaltas = Math.max(0, diasLaborables - totalDiasAsistidos);
      const totalHoras = asistencias.reduce((sum, a) => sum + Number(a.horasTrabajadas || 0), 0);
      const pctAsistencia = (totalDiasAsistidos / (diasLaborables || 1)) * 100;

      let reglaGanadora = null;
      for (const r of reglas) {
        let cumple = true;
        if (pctAsistencia < (r.minDiasTrabajados || 0)) cumple = false;
        if (totalTardias > (r.maxTardias ?? 999)) cumple = false;
        if (totalFaltas > (r.maxFaltas ?? 999)) cumple = false;
        if (totalHoras < (r.minHoras || 0)) cumple = false;
        if (cumple) { reglaGanadora = r; break; }
      }

      let resultado = await this.bonoResultadoRepository.findOne({ where: { empleadoId: emp.empleadoId, mes, anio } });
      if (!resultado) {
        resultado = this.bonoResultadoRepository.create({ empleadoId: emp.empleadoId, mes, anio, fechaCalculo: new Date() });
      }
      resultado.reglaBonoId = reglaGanadora ? reglaGanadora.reglaBonoId : reglas[reglas.length - 1].reglaBonoId;
      resultado.elegible = !!reglaGanadora;
      resultado.cumplimientoPct = Math.round(pctAsistencia * 100) / 100;
      resultado.motivoNoElegible = reglaGanadora ? 'Cumple criterios de: ' + reglaGanadora.nombre : 'No califica.';
      await this.bonoResultadoRepository.save(resultado);
    }
    return { message: `Evaluación completada con ${reglas.length} reglas.` };
  }

  // Auditoría
  async getAuditLogs(fechaInicio?: string, fechaFin?: string, usuarioId?: number, modulo?: string) {
    const where: any = {};
    if (fechaInicio && fechaFin) where.fechaHora = Between(new Date(fechaInicio), new Date(fechaFin));
    if (usuarioId) where.usuarioId = usuarioId;
    if (modulo) where.modulo = modulo;
    return await this.auditRepository.find({ relations: ['usuario'], order: { fechaHora: 'DESC' }, take: 500, where });
  }

  // Dashboard Stats
  async getAdminDashboardStats() {
    const today = new Date(); today.setHours(0,0,0,0);
    return {
      usuariosActivos: await this.usuarioRepository.count({ where: { estado: 'activo' } }),
      usuariosBloqueados: await this.usuarioRepository.count({ where: { estado: Not('activo') } }),
      eventosAuditoria: await this.auditRepository.count({ where: { fechaHora: MoreThanOrEqual(today) } }),
      estadoSistema: 'Óptimo'
    };
  }

  async getRrhhDashboardStats() {
    return {
      empleadosActivos: await this.empleadoRepository.count({ where: { activo: true } }),
      tardiasHoy: await this.registroAsistenciaRepository.count({ where: { fecha: new Date() as any, minutosTardia: MoreThan(0) } }),
      permisosPendientes: await this.solicitudPermisoRepository.count({ where: { estado: 'pendiente' } }),
      vacacionesActivas: 0, empleadosEnRiesgo: 0, empleadosConTurnoInactivo: 0
    };
  }

  async getSupervisorDashboardStats(supervisorId: number) {
    return {
      empleadosACargo: await this.empleadoRepository.count({ where: { supervisorId, activo: true } }),
      permisosPendientes: await this.solicitudPermisoRepository.createQueryBuilder('sp').innerJoin('sp.empleado', 'emp').where('emp.supervisorId = :supervisorId AND sp.estado = :estado', { supervisorId, estado: 'pendiente' }).getCount(),
      horasPendientes: await this.registroTiempoRepository.createQueryBuilder('rt').innerJoin('rt.empleado', 'emp').where('emp.supervisorId = :supervisorId AND rt.estado = :estado', { supervisorId, estado: 'pendiente' }).getCount(),
      kpiPromedio: 0
    };
  }

  // Otros
  async getRoles() { return await this.rolRepository.find(); }
  async getAssignments() { return await this.empleadoTurnoRepository.find({ relations: ['empleado', 'turno'], where: { activo: true } }); }
  async assignShift(dto: any, uid: number) {
    await this.empleadoTurnoRepository.update({ empleadoId: dto.empleadoId }, { activo: false });
    await this.empleadoTurnoRepository.save(this.empleadoTurnoRepository.create({ ...dto, activo: true }));
    return this.getAssignments();
  }
  async getKpiParameters() {
    const params = await this.parametroRepository.find({ where: { activo: true } });
    const res = {}; params.forEach(p => res[p.clave] = p.valor); return res;
  }
  async updateKpiParameters(dto: any, uid: number) {
    for (const [k, v] of Object.entries(dto)) { await this.parametroRepository.update({ clave: k }, { valor: v as string }); }
    return this.getKpiParameters();
  }

  private sanitizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str.replace(/Rodr\?guez/g, 'Rodríguez').replace(/Mart\?nez/g, 'Martínez').replace(/Fern\?ndez/g, 'Fernández').replace(/Garc\?a/g, 'García').replace(/L\?pez/g, 'López').replace(/Tecnolog\?a/g, 'Tecnología').replace(/Mart\?n/g, 'Martín').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á');
  }
}
