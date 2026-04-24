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
    private dataSource: DataSource,
  ) {}

  async getTiposPermiso(todos = false) {
    const where: any = {};
    if (!todos) where.activo = true;
    const tipos = await this.tipoPermisoRepository.find({
      where,
      order: { nombre: 'ASC' },
    });
    return tipos.map(t => ({
      ...t,
      nombre: this.sanitizeString(t.nombre)
    }));
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

    return solicitudes.map(s => {
      const diasSolicitados = this.calculateDays(s.fechaInicio, s.fechaFin);
      return {
        ...s,
        empleadoNombre: this.sanitizeString(`${s.empleado?.nombres} ${s.empleado?.apellidos}`),
        departamento: this.sanitizeString(s.empleado?.departamento),
        tipoPermisoNombre: this.sanitizeString(s.tipoPermiso?.nombre),
        diasSolicitados,
        diasDisponibles: s.empleado?.vacacionSaldo?.diasDisponibles ?? 0
      };
    });
  }

  async getAllBalances() {
    const saldos = await this.vacacionSaldoRepository.find({
      relations: ['empleado'],
      order: { empleado: { nombres: 'ASC' } },
    });

    return saldos.map(s => ({
      ...s,
      empleadoNombre: this.sanitizeString(`${s.empleado?.nombres} ${s.empleado?.apellidos}`),
      departamento: this.sanitizeString(s.empleado?.departamento)
    }));
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
    const saldo = await this.vacacionSaldoRepository.findOne({
      where: { empleadoId: dto.empleadoId }
    });
    if (!saldo) throw new NotFoundException('Saldo no encontrado');

    const diasNum = Number(dto.dias);
    const nuevosDisponibles = Number(saldo.diasDisponibles) + diasNum;

    await this.vacacionSaldoRepository.update(saldo.saldoId, {
      diasDisponibles: nuevosDisponibles
    });

    await this.vacacionMovimientoRepository.save({
      empleadoId: dto.empleadoId,
      tipo: diasNum > 0 ? VacacionMovimiento.TIPO_ACUMULACION : VacacionMovimiento.TIPO_CONSUMO,
      dias: Math.abs(diasNum),
      fecha: new Date(),
      comentario: `Ajuste manual RRHH: ${dto.motivo}`
    });

    return { message: 'Saldo ajustado correctamente' };
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

  private calculateDays(start: any, end: any): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  async createRequest(createDto: any, empleadoId: number) {
    const tipoPermiso = await this.tipoPermisoRepository.findOne({ where: { tipoPermisoId: createDto.tipoPermisoId } });
    if (!tipoPermiso) throw new NotFoundException('Tipo de permiso no encontrado');

    const fechaInicio = new Date(createDto.fechaInicio);
    const fechaFin = new Date(createDto.fechaFin);

    const solicitud = this.solicitudRepository.create({
      empleadoId,
      tipoPermisoId: createDto.tipoPermisoId,
      fechaInicio,
      fechaFin,
      motivo: createDto.motivo,
      estado: SolicitudPermiso.ESTADO_PENDIENTE,
    });

    const saved = await this.solicitudRepository.save(solicitud);

    if (createDto.archivo && createDto.nombreArchivo) {
      await this.saveAttachment(
        saved.solicitudId,
        createDto.archivo,
        createDto.nombreArchivo,
        createDto.tipoMime || 'application/octet-stream',
      );
    }

    return { solicitudId: saved.solicitudId, estado: saved.estado, mensaje: 'Solicitud creada exitosamente' };
  }

  private async saveAttachment(
    solicitudId: number,
    base64Data: string,
    nombreArchivo: string,
    tipoMime: string,
  ): Promise<void> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'solicitudes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const safeName = nombreArchivo.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${solicitudId}_${Date.now()}_${safeName}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const adjunto = this.adjuntoRepository.create({
      solicitudId,
      nombreArchivo: nombreArchivo,
      rutaUrl: `/attachment/${fileName}`,
      tipoMime,
    });

    await this.adjuntoRepository.save(adjunto);
  }

  async getMyRequests(empleadoId: number) {
    return await this.solicitudRepository.find({
      where: { empleadoId },
      relations: ['tipoPermiso', 'decisiones', 'adjuntos'],
      order: { fechaSolicitud: 'DESC' },
    });
  }

  async getPendingRequests(supervisorEmpleadoId: number) {
    const empleadosRaw = await this.dataSource.query(
      `SELECT empleado_id FROM EMPLEADO WHERE supervisor_id = @0 AND activo = 1`,
      [supervisorEmpleadoId],
    );
    if (empleadosRaw.length === 0) return [];
    const ids = empleadosRaw.map((e: any) => e.empleado_id);
    return await this.solicitudRepository.find({
      where: { empleadoId: In(ids), estado: SolicitudPermiso.ESTADO_PENDIENTE },
      relations: ['empleado', 'tipoPermiso', 'adjuntos'],
      order: { fechaSolicitud: 'DESC' }
    });
  }

  async approveRequest(solicitudId: number, comentario: string, usuarioId: number) {
    const solicitud = await this.solicitudRepository.findOne({ where: { solicitudId }, relations: ['tipoPermiso'] });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    if (solicitud.estado !== SolicitudPermiso.ESTADO_PENDIENTE) {
      throw new BadRequestException('La solicitud ya no está pendiente');
    }

    const diasSolicitados = this.calculateDays(solicitud.fechaInicio, solicitud.fechaFin);

    if (solicitud.tipoPermiso?.descuentaVacaciones) {
      const saldo = await this.vacacionSaldoRepository.findOne({ where: { empleadoId: solicitud.empleadoId } });
      if (saldo) {
        await this.vacacionSaldoRepository.update(saldo.saldoId, {
          diasDisponibles: Number(saldo.diasDisponibles) - diasSolicitados,
          diasUsados: Number(saldo.diasUsados) + diasSolicitados
        });
        await this.vacacionMovimientoRepository.save({
          empleadoId: solicitud.empleadoId, solicitudId, tipo: VacacionMovimiento.TIPO_CONSUMO,
          dias: diasSolicitados, fecha: new Date(), comentario: `Uso por solicitud #${solicitudId}`,
        });
      }
    }

    solicitud.estado = SolicitudPermiso.ESTADO_APROBADO;
    await this.solicitudRepository.save(solicitud);
    await this.decisionRepository.save({ solicitudId, usuarioId, decision: DecisionPermiso.DECISION_APROBADO, comentario, fechaHora: new Date() });
    return { message: 'Solicitud aprobada' };
  }

  async rejectRequest(solicitudId: number, comentario: string, usuarioId: number) {
    const solicitud = await this.solicitudRepository.findOne({ where: { solicitudId } });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

    if (solicitud.estado !== SolicitudPermiso.ESTADO_PENDIENTE) {
      throw new BadRequestException('La solicitud ya no está pendiente');
    }

    solicitud.estado = SolicitudPermiso.ESTADO_RECHAZADO;
    await this.solicitudRepository.save(solicitud);
    await this.decisionRepository.save({ solicitudId, usuarioId, decision: DecisionPermiso.DECISION_RECHAZADO, comentario, fechaHora: new Date() });
    return { message: 'Solicitud rechazada' };
  }

  async getVacationBalance(empleadoId: number) {
    let saldo = await this.vacacionSaldoRepository.findOne({ where: { empleadoId } });
    if (!saldo) {
      saldo = this.vacacionSaldoRepository.create({ empleadoId, diasDisponibles: 15, diasUsados: 0, fechaCorte: new Date() });
      await this.vacacionSaldoRepository.save(saldo);
    }
    return {
      empleadoId: saldo.empleadoId,
      diasDisponibles: saldo.diasDisponibles,
      diasUsados: saldo.diasUsados,
      diasTotales: Number(saldo.diasDisponibles) + Number(saldo.diasUsados),
    };
  }

  async getAttachment(fileName: string, res: any) {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'solicitudes');
    const filePath = path.join(uploadsDir, fileName);
    if (!fs.existsSync(filePath)) throw new NotFoundException('Archivo no encontrado');
    res.sendFile(filePath);
  }
}
