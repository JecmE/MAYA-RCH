import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SolicitudPermiso } from '../../entities/solicitud-permiso.entity';
import { TipoPermiso } from '../../entities/tipo-permiso.entity';
import { DecisionPermiso } from '../../entities/decision-permiso.entity';
import { VacacionSaldo } from '../../entities/vacacion-saldo.entity';
import { VacacionMovimiento } from '../../entities/vacacion-movimiento.entity';
import { Empleado } from '../../entities/empleado.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { AdjuntoSolicitud } from '../../entities/adjunto-solicitud.entity';
import { NoticesService } from '../notices/notices.service';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(SolicitudPermiso)
    private solicitudRepository: Repository<SolicitudPermiso>,
    @InjectRepository(TipoPermiso)
    private tipoPermisoRepository: Repository<TipoPermiso>,
    @InjectRepository(DecisionPermiso)
    private decisionRepository: Repository<DecisionPermiso>,
    @InjectRepository(VacacionSaldo)
    private vacacionSaldoRepository: Repository<VacacionSaldo>,
    @InjectRepository(VacacionMovimiento)
    private vacacionMovimientoRepository: Repository<VacacionMovimiento>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    @InjectRepository(AdjuntoSolicitud)
    private adjuntoRepository: Repository<AdjuntoSolicitud>,
    private noticesService: NoticesService,
    private dataSource: DataSource,
  ) {}

  async getTiposPermiso(todos = false) {
    const where: any = {};
    if (!todos) where.activo = true;
    const tipos = await this.tipoPermisoRepository.find({ where, order: { nombre: 'ASC' } });
    return tipos.map(t => ({ ...t, nombre: this.sanitizeString(t.nombre) }));
  }

  async createTipoPermiso(dto: any, usuarioId: number) {
    const tipo = this.tipoPermisoRepository.create({ ...dto, activo: true });
    const saved = await this.tipoPermisoRepository.save(tipo);
    const savedSingle = Array.isArray(saved) ? saved[0] : saved;
    await this.auditRepository.save({
      usuarioId, modulo: 'CONFIGURACION', accion: 'CREATE',
      entidad: 'TIPO_PERMISO', entidadId: savedSingle.tipoPermisoId,
      detalle: `Tipo de permiso creado: ${savedSingle.nombre}`,
    });
    return savedSingle;
  }

  async updateTipoPermiso(id: number, dto: any, usuarioId: number) {
    const tipo = await this.tipoPermisoRepository.findOne({ where: { tipoPermisoId: id } });
    if (!tipo) throw new NotFoundException('Tipo no encontrado');
    Object.assign(tipo, dto);
    const saved = await this.tipoPermisoRepository.save(tipo);
    const savedSingle = Array.isArray(saved) ? saved[0] : saved;
    await this.auditRepository.save({
      usuarioId, modulo: 'CONFIGURACION', accion: 'UPDATE',
      entidad: 'TIPO_PERMISO', entidadId: id,
      detalle: `Tipo de permiso actualizado: ${savedSingle.nombre}`,
    });
    return savedSingle;
  }

  async getAllRequests() {
    const solicitudes = await this.solicitudRepository.find({
      relations: ['empleado', 'empleado.vacacionSaldo', 'tipoPermiso', 'adjuntos', 'decisiones', 'decisiones.usuario'],
      order: { fechaSolicitud: 'DESC' },
    });
    return solicitudes.map(s => ({
        ...s,
        empleadoNombre: this.sanitizeString(`${s.empleado?.nombres} ${s.empleado?.apellidos}`),
        departamento: this.sanitizeString(s.empleado?.departamento),
        tipoPermisoNombre: this.sanitizeString(s.tipoPermiso?.nombre),
        diasSolicitados: this.calculateDays(s.fechaInicio, s.fechaFin),
        diasDisponibles: s.empleado?.vacacionSaldo?.diasDisponibles ?? 0
    }));
  }

  async getPendingRequests(supervisorEmpleadoId: number, estado?: string) {
    const equipo = await this.empleadoRepository.find({
        where: { supervisorId: supervisorEmpleadoId, activo: true },
        select: ['empleadoId']
    });

    if (equipo.length === 0) return [];
    const ids = equipo.map(e => e.empleadoId);

    const where: any = { empleadoId: In(ids) };
    if (estado && estado !== 'todos') {
        where.estado = estado;
    }

    const solicitudes = await this.solicitudRepository.find({
      where,
      relations: ['empleado', 'tipoPermiso', 'adjuntos', 'decisiones', 'decisiones.usuario'],
      order: { fechaSolicitud: 'DESC' }
    });

    return solicitudes.map(s => ({
        ...s,
        empleadoNombre: this.sanitizeString(`${s.empleado?.nombres} ${s.empleado?.apellidos}`),
        tipoPermisoNombre: this.sanitizeString(s.tipoPermiso?.nombre),
        diasSolicitados: this.calculateDays(s.fechaInicio, s.fechaFin)
    }));
  }

  async approveRequest(solicitudId: number, comentario: string, usuarioId: number) {
    const solicitud = await this.solicitudRepository.findOne({ where: { solicitudId }, relations: ['tipoPermiso', 'empleado', 'empleado.usuario'] });
    if (!solicitud || solicitud.estado !== SolicitudPermiso.ESTADO_PENDIENTE) {
      throw new BadRequestException('Solicitud no válida o ya procesada');
    }

    if (solicitud.tipoPermiso?.descuentaVacaciones) {
      const saldo = await this.vacacionSaldoRepository.findOne({ where: { empleadoId: solicitud.empleadoId } });
      if (saldo) {
        const dias = this.calculateDays(solicitud.fechaInicio, solicitud.fechaFin);
        await this.vacacionSaldoRepository.update(saldo.saldoId, {
          diasDisponibles: Number(saldo.diasDisponibles) - dias,
          diasUsados: Number(saldo.diasUsados) + dias
        });
        await this.vacacionMovimientoRepository.save({
          empleadoId: solicitud.empleadoId, tipo: VacacionMovimiento.TIPO_CONSUMO,
          dias, fecha: new Date(), comentario: `Uso por solicitud #${solicitudId}`,
        });
      }
    }

    solicitud.estado = SolicitudPermiso.ESTADO_APROBADO;
    await this.solicitudRepository.save(solicitud);
    await this.decisionRepository.save({ solicitudId, usuarioId, decision: 'aprobado', comentario, fechaHora: new Date() });
    return { message: 'Solicitud aprobada' };
  }

  async rejectRequest(solicitudId: number, comentario: string, usuarioId: number) {
    const solicitud = await this.solicitudRepository.findOne({ where: { solicitudId } });
    if (!solicitud || solicitud.estado !== SolicitudPermiso.ESTADO_PENDIENTE) throw new BadRequestException('Solicitud no válida');
    solicitud.estado = SolicitudPermiso.ESTADO_RECHAZADO;
    await this.solicitudRepository.save(solicitud);
    await this.decisionRepository.save({ solicitudId, usuarioId, decision: 'rechazado', comentario, fechaHora: new Date() });
    return { message: 'Solicitud rechazada' };
  }

  async getVacationMovements() {
    const movs = await this.vacacionMovimientoRepository.find({
      relations: ['empleado'],
      order: { fecha: 'DESC' },
      take: 500,
    });
    return movs.map(m => ({
      ...m,
      empleadoNombre: this.sanitizeString(`${m.empleado?.nombres} ${m.empleado?.apellidos}`)
    }));
  }

  async adjustVacationBalance(dto: any, usuarioId: number) {
    const saldo = await this.vacacionSaldoRepository.findOne({ where: { empleadoId: dto.empleadoId } });
    if (!saldo) throw new NotFoundException('Saldo no encontrado');
    const diasNum = Number(dto.dias);
    const nuevosDisponibles = Number(saldo.diasDisponibles) + diasNum;
    await this.vacacionSaldoRepository.update(saldo.saldoId, { diasDisponibles: nuevosDisponibles });
    await this.vacacionMovimientoRepository.save({
      empleadoId: dto.empleadoId, tipo: diasNum > 0 ? VacacionMovimiento.TIPO_ACUMULACION : VacacionMovimiento.TIPO_CONSUMO,
      dias: Math.abs(diasNum), fecha: new Date(), comentario: `Ajuste manual RRHH: ${dto.motivo}`
    });
    return { message: 'Saldo ajustado correctamente' };
  }

  async getAttachment(fileName: string, res: any) {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'solicitudes');
    const filePath = path.join(uploadsDir, fileName);
    if (!fs.existsSync(filePath)) throw new NotFoundException('Archivo no encontrado');
    res.sendFile(filePath);
  }

  private sanitizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str.replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á')
              .replace(/Ã©/g, 'é').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ')
              .replace(/Rodr\?guez/g, 'Rodríguez').replace(/Garc\?a/g, 'García');
  }

  private calculateDays(start: any, end: any): number {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  async getVacationBalance(empleadoId: number) {
    let saldo = await this.vacacionSaldoRepository.findOne({ where: { empleadoId } });
    if (!saldo) {
      saldo = await this.vacacionSaldoRepository.save(this.vacacionSaldoRepository.create({ empleadoId, diasDisponibles: 15, diasUsados: 0, fechaCorte: new Date() }));
    }
    return { empleadoId: saldo.empleadoId, diasDisponibles: saldo.diasDisponibles, diasUsados: saldo.diasUsados, diasTotales: Number(saldo.diasDisponibles) + Number(saldo.diasUsados) };
  }

  async getAllBalances() {
    const saldos = await this.vacacionSaldoRepository.find({ relations: ['empleado'], order: { empleado: { nombres: 'ASC' } } });
    return saldos.map(s => ({ ...s, empleadoNombre: this.sanitizeString(`${s.empleado?.nombres} ${s.empleado?.apellidos}`), departamento: this.sanitizeString(s.empleado?.departamento) }));
  }

  async createRequest(createDto: any, empleadoId: number) {
    const { archivo, nombreArchivo, tipoMime, ...datosSolicitud } = createDto;

    const solicitud = this.solicitudRepository.create({
      ...datosSolicitud,
      empleadoId,
      estado: SolicitudPermiso.ESTADO_PENDIENTE,
    });

    const saved = await this.solicitudRepository.save(solicitud);
    const savedSingle = Array.isArray(saved) ? saved[0] : saved;

    // SI HAY ARCHIVO, PROCESARLO
    if (archivo && nombreArchivo) {
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'solicitudes');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `${Date.now()}_${nombreArchivo.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadsDir, fileName);

        // Convertir base64 a archivo físico
        fs.writeFileSync(filePath, Buffer.from(archivo, 'base64'));

        // Guardar referencia en la DB
        await this.adjuntoRepository.save({
          solicitudId: savedSingle.solicitudId,
          nombreArchivo: nombreArchivo,
          rutaUrl: fileName, // Guardamos el nombre para el endpoint de descarga
          tipoMime: tipoMime || 'application/pdf'
        });
      } catch (error) {
        console.error('Error guardando adjunto:', error);
        // No bloqueamos la solicitud si falla el adjunto, pero lo logueamos
      }
    }

    return { solicitudId: savedSingle.solicitudId, estado: savedSingle.estado };
  }

  async getMyRequests(empleadoId: number) {
    return await this.solicitudRepository.find({ where: { empleadoId }, relations: ['tipoPermiso', 'decisiones', 'adjuntos'], order: { fechaSolicitud: 'DESC' } });
  }
}
