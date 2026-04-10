import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Empleado } from '../../entities/empleado.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Rol } from '../../entities/rol.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    private dataSource: DataSource,
  ) {}

  async findAllEmpleados(activo?: string) {
    let query = `
      SELECT e.empleado_id, e.codigo_empleado, e.nombres, e.apellidos, 
             e.email, e.telefono, e.fecha_ingreso, e.activo, e.puesto, 
             e.tarifa_hora, e.supervisor_id, e.departamento
      FROM EMPLEADO e
    `;

    if (activo !== undefined) {
      query += ` WHERE e.activo = ${activo === 'true' ? 1 : 0}`;
    }

    query += ` ORDER BY e.nombres ASC`;

    const empleados = await this.dataSource.query(query);

    return empleados.map((emp: any) => ({
      empleadoId: emp.empleado_id,
      codigoEmpleado: emp.codigo_empleado,
      nombres: emp.nombres,
      apellidos: emp.apellidos,
      nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
      email: emp.email,
      telefono: emp.telefono,
      fechaIngreso: emp.fecha_ingreso,
      activo: emp.activo,
      departamento: emp.departamento || null,
      puesto: emp.puesto,
      supervisorId: emp.supervisor_id,
    }));
  }

  async getMyProfile(empleadoId: number) {
    const empleados = await this.dataSource.query(`
      SELECT e.empleado_id, e.codigo_empleado, e.nombres, e.apellidos, 
             e.email, e.telefono, e.fecha_ingreso, e.puesto, e.tarifa_hora,
             e.departamento
      FROM EMPLEADO e
      WHERE e.empleado_id = ${empleadoId}
    `);

    if (!empleados || empleados.length === 0) {
      throw new NotFoundException('Empleado no encontrado');
    }

    const emp: any = empleados[0];

    const rolesResult = await this.dataSource.query(`
      SELECT r.nombre FROM ROL r 
      INNER JOIN USUARIO_ROL ur ON r.rol_id = ur.rol_id 
      WHERE ur.usuario_id = (SELECT usuario_id FROM USUARIO WHERE empleado_id = ${empleadoId})
    `);

    return {
      empleadoId: emp.empleado_id,
      codigoEmpleado: emp.codigo_empleado,
      nombres: emp.nombres,
      apellidos: emp.apellidos,
      nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
      email: emp.email,
      telefono: emp.telefono,
      fechaIngreso: emp.fecha_ingreso,
      departamento: emp.departamento || null,
      puesto: emp.puesto,
      tarifaHora: emp.tarifa_hora,
      roles: rolesResult.map((r: any) => r.nombre),
    };
  }

  async findEmpleadoById(id: number) {
    const empleados = await this.dataSource.query(`
      SELECT e.empleado_id, e.codigo_empleado, e.nombres, e.apellidos, 
             e.email, e.telefono, e.fecha_ingreso, e.activo, e.puesto, 
             e.tarifa_hora, e.supervisor_id, e.departamento
      FROM EMPLEADO e
      WHERE e.empleado_id = ${id}
    `);

    if (!empleados || empleados.length === 0) {
      throw new NotFoundException('Empleado no encontrado');
    }

    const emp: any = empleados[0];

    const rolesResult = await this.dataSource.query(`
      SELECT r.nombre FROM ROL r 
      INNER JOIN USUARIO_ROL ur ON r.rol_id = ur.rol_id 
      WHERE ur.usuario_id = (SELECT usuario_id FROM USUARIO WHERE empleado_id = ${id})
    `);

    return {
      empleadoId: emp.empleado_id,
      codigoEmpleado: emp.codigo_empleado,
      nombres: emp.nombres,
      apellidos: emp.apellidos,
      nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
      email: emp.email,
      telefono: emp.telefono,
      fechaIngreso: emp.fecha_ingreso,
      activo: emp.activo,
      departamento: emp.departamento || null,
      puesto: emp.puesto,
      tarifaHora: emp.tarifa_hora,
      supervisorId: emp.supervisor_id,
      roles: rolesResult.map((r: any) => r.nombre),
    };
  }

  async createEmpleado(createEmpleadoDto: CreateEmpleadoDto, usuarioId: number) {
    const existing = await this.empleadoRepository.findOne({
      where: [
        { email: createEmpleadoDto.email },
        { codigoEmpleado: createEmpleadoDto.codigoEmpleado },
      ],
    });

    if (existing) {
      throw new BadRequestException('Ya existe un empleado con ese email o código');
    }

    const empleado = this.empleadoRepository.create({
      ...createEmpleadoDto,
      activo: true,
    });

    const saved = (await this.empleadoRepository.save(empleado)) as unknown as Empleado;

    await this.auditRepository.save({
      usuarioId,
      modulo: 'EMPLEADOS',
      accion: 'CREATE',
      entidad: 'EMPLEADO',
      entidadId: saved.empleadoId,
      detalle: `Empleado creado: ${saved.nombres} ${saved.apellidos}`,
    });

    return this.findEmpleadoById(saved.empleadoId);
  }

  async updateEmpleado(id: number, updateEmpleadoDto: UpdateEmpleadoDto, usuarioId: number) {
    const empleado = await this.empleadoRepository.findOne({
      where: { empleadoId: id },
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }

    Object.assign(empleado, updateEmpleadoDto);
    await this.empleadoRepository.save(empleado);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'EMPLEADOS',
      accion: 'UPDATE',
      entidad: 'EMPLEADO',
      entidadId: id,
      detalle: `Empleado actualizado`,
    });

    return this.findEmpleadoById(id);
  }

  async deactivateEmpleado(id: number, usuarioId: number) {
    const empleado = await this.empleadoRepository.findOne({
      where: { empleadoId: id },
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }

    empleado.activo = false;
    await this.empleadoRepository.save(empleado);

    const usuario = await this.usuarioRepository.findOne({
      where: { empleadoId: id },
    });

    if (usuario) {
      usuario.estado = 'bloqueado';
      await this.usuarioRepository.save(usuario);
    }

    await this.auditRepository.save({
      usuarioId,
      modulo: 'EMPLEADOS',
      accion: 'DEACTIVATE',
      entidad: 'EMPLEADO',
      entidadId: id,
      detalle: `Empleado desactivado: ${empleado.nombres} ${empleado.apellidos}`,
    });

    return { message: 'Empleado desactivado correctamente' };
  }

  async createUsuario(empleadoId: number, createUsuarioDto: CreateUsuarioDto, usuarioId: number) {
    const empleado = await this.empleadoRepository.findOne({
      where: { empleadoId },
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }

    const existingUsuario = await this.usuarioRepository.findOne({
      where: { empleadoId },
    });

    if (existingUsuario) {
      throw new BadRequestException('El empleado ya tiene un usuario asignado');
    }

    const existingUsername = await this.usuarioRepository.findOne({
      where: { username: createUsuarioDto.username },
    });

    if (existingUsername) {
      throw new BadRequestException('El nombre de usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(createUsuarioDto.password, 10);

    const roles = await this.rolRepository.findByIds(createUsuarioDto.rolIds);

    const usuario = this.usuarioRepository.create({
      empleadoId,
      username: createUsuarioDto.username,
      passwordHash: hashedPassword,
      estado: 'activo',
      roles,
    });

    const saved = (await this.usuarioRepository.save(usuario)) as unknown as Usuario;

    await this.auditRepository.save({
      usuarioId,
      modulo: 'USUARIOS',
      accion: 'CREATE',
      entidad: 'USUARIO',
      entidadId: saved.usuarioId,
      detalle: `Usuario creado para empleado: ${empleado.nombreCompleto}`,
    });

    return {
      usuarioId: saved.usuarioId,
      empleadoId: saved.empleadoId,
      username: saved.username,
      estado: saved.estado,
      roles: roles.map((r) => r.nombre),
    };
  }

  async updateUsuario(empleadoId: number, updateUsuarioDto: UpdateUsuarioDto, usuarioId: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { empleadoId },
      relations: ['roles'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (updateUsuarioDto.password) {
      usuario.passwordHash = await bcrypt.hash(updateUsuarioDto.password, 10);
    }

    if (updateUsuarioDto.estado) {
      usuario.estado = updateUsuarioDto.estado;
    }

    if (updateUsuarioDto.rolIds) {
      usuario.roles = await this.rolRepository.findByIds(updateUsuarioDto.rolIds);
    }

    await this.usuarioRepository.save(usuario);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'USUARIOS',
      accion: 'UPDATE',
      entidad: 'USUARIO',
      entidadId: usuario.usuarioId,
      detalle: `Usuario actualizado`,
    });

    return {
      usuarioId: usuario.usuarioId,
      username: usuario.username,
      estado: usuario.estado,
      roles: usuario.roles.map((r) => r.nombre),
    };
  }

  async getEquipoBySupervisor(supervisorId: number) {
    const empleados = await this.dataSource.query(`
      SELECT e.empleado_id, e.codigo_empleado, e.nombres, e.apellidos, 
             e.email, e.activo, e.puesto, e.departamento
      FROM EMPLEADO e
      WHERE e.supervisor_id = ${supervisorId}
      ORDER BY e.nombres ASC
    `);

    return empleados.map((emp: any) => ({
      empleadoId: emp.empleado_id,
      codigoEmpleado: emp.codigo_empleado,
      nombres: emp.nombres,
      apellidos: emp.apellidos,
      nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
      email: emp.email,
      departamento: emp.departamento || null,
      puesto: emp.puesto,
      activo: emp.activo,
    }));
  }
}
