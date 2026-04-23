import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Empleado } from '../../entities/empleado.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Rol } from '../../entities/rol.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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

  private sanitizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str
      .replace(/\?/g, (match, offset, original) => {
        if (original.includes('Tecnolog')) return 'í';
        if (original.includes('Garc')) return 'í';
        if (original.includes('Rodr')) return 'í';
        if (original.includes('Mart')) return 'í';
        return 'í';
      })
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã±/g, 'ñ');
  }

  async findAllEmpleados(activo?: string) {
    const where: any = {};
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const empleados = await this.empleadoRepository.find({
      where,
      order: { nombres: 'ASC' },
      relations: ['usuario', 'usuario.roles', 'supervisor'],
    });

    return empleados.map((emp) => ({
      empleadoId: emp.empleadoId,
      codigoEmpleado: emp.codigoEmpleado,
      nombres: this.sanitizeString(emp.nombres),
      apellidos: this.sanitizeString(emp.apellidos),
      nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
      email: emp.email,
      telefono: emp.telefono,
      fechaIngreso: emp.fechaIngreso,
      activo: emp.activo,
      departamento: this.sanitizeString(emp.departamento),
      puesto: this.sanitizeString(emp.puesto),
      supervisorId: emp.supervisorId,
      supervisorNombre: emp.supervisor ? this.sanitizeString(`${emp.supervisor.nombres} ${emp.supervisor.apellidos}`) : null,
      roles: emp.usuario?.roles?.map((r) => r.nombre) || [],
    }));
  }

  async getMyProfile(empleadoId: number) {
    const emp = await this.empleadoRepository.findOne({
      where: { empleadoId },
      relations: ['usuario', 'usuario.roles', 'supervisor'],
    });

    if (!emp) {
      throw new NotFoundException('Empleado no encontrado');
    }

    return {
      empleadoId: emp.empleadoId,
      codigoEmpleado: emp.codigoEmpleado,
      nombres: this.sanitizeString(emp.nombres),
      apellidos: this.sanitizeString(emp.apellidos),
      nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
      email: emp.email,
      telefono: emp.telefono,
      fechaIngreso: emp.fechaIngreso,
      departamento: this.sanitizeString(emp.departamento),
      puesto: this.sanitizeString(emp.puesto),
      tarifaHora: emp.tarifaHora,
      roles: emp.usuario?.roles?.map((r) => r.nombre) || [],
      supervisorId: emp.supervisorId,
      supervisorNombre: emp.supervisor ? this.sanitizeString(`${emp.supervisor.nombres} ${emp.supervisor.apellidos}`) : null,
    };
  }

  async findEmpleadoById(id: number) {
    const emp = await this.empleadoRepository.findOne({
      where: { empleadoId: id },
      relations: ['usuario', 'usuario.roles', 'supervisor'],
    });

    if (!emp) {
      throw new NotFoundException('Empleado no encontrado');
    }

    return {
      empleadoId: emp.empleadoId,
      codigoEmpleado: emp.codigoEmpleado,
      nombres: this.sanitizeString(emp.nombres),
      apellidos: this.sanitizeString(emp.apellidos),
      nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
      email: emp.email,
      telefono: emp.telefono,
      fechaIngreso: emp.fechaIngreso,
      activo: emp.activo,
      departamento: this.sanitizeString(emp.departamento),
      puesto: this.sanitizeString(emp.puesto),
      tarifaHora: emp.tarifaHora,
      supervisorId: emp.supervisorId,
      supervisorNombre: emp.supervisor ? this.sanitizeString(`${emp.supervisor.nombres} ${emp.supervisor.apellidos}`) : null,
      roles: emp.usuario?.roles?.map((r) => r.nombre) || [],
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

    const saved = await this.empleadoRepository.save(empleado);

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

    // Sincronizar estado con el usuario si viene el campo 'activo'
    if (updateEmpleadoDto.activo !== undefined) {
      const usuario = await this.usuarioRepository.findOne({
        where: { empleadoId: id },
      });
      if (usuario) {
        usuario.estado = updateEmpleadoDto.activo ? 'activo' : 'bloqueado';
        await this.usuarioRepository.save(usuario);
      }
    }

    Object.assign(empleado, updateEmpleadoDto);
    await this.empleadoRepository.save(empleado);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'EMPLEADOS',
      accion: 'UPDATE',
      entidad: 'EMPLEADO',
      entidadId: id,
      detalle: `Empleado actualizado: ${empleado.nombres} ${empleado.apellidos}`,
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

    const roles = await this.rolRepository.find({
      where: { rolId: In(createUsuarioDto.rolIds || []) }
    });

    const usuario = this.usuarioRepository.create({
      empleadoId,
      username: createUsuarioDto.username,
      passwordHash: hashedPassword,
      estado: 'activo',
      roles,
    });

    const saved = await this.usuarioRepository.save(usuario);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'USUARIOS',
      accion: 'CREATE',
      entidad: 'USUARIO',
      entidadId: saved.usuarioId,
      detalle: `Usuario creado para empleado: ${empleado.nombres} ${empleado.apellidos}`,
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
      usuario.roles = await this.rolRepository.find({
        where: { rolId: In(updateUsuarioDto.rolIds) }
      });
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

  async changePassword(usuarioId: number, changePasswordDto: ChangePasswordDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isMatch = await bcrypt.compare(changePasswordDto.oldPassword, usuario.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    usuario.passwordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.usuarioRepository.save(usuario);

    await this.auditRepository.save({
      usuarioId,
      modulo: 'SEGURIDAD',
      accion: 'UPDATE',
      entidad: 'USUARIO',
      entidadId: usuarioId,
      detalle: `Contraseña actualizada por el propio usuario`,
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async getEquipoBySupervisor(supervisorId: number) {
    const empleados = await this.empleadoRepository.find({
      where: { supervisorId },
      order: { nombres: 'ASC' }
    });

    return empleados.map((emp) => ({
      empleadoId: emp.empleadoId,
      codigoEmpleado: emp.codigoEmpleado,
      nombres: this.sanitizeString(emp.nombres),
      apellidos: this.sanitizeString(emp.apellidos),
      nombreCompleto: this.sanitizeString(`${emp.nombres} ${emp.apellidos}`),
      email: emp.email,
      departamento: this.sanitizeString(emp.departamento),
      puesto: this.sanitizeString(emp.puesto),
      activo: emp.activo,
    }));
  }
}
