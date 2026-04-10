import { Repository, DataSource } from 'typeorm';
import { Empleado } from '../../entities/empleado.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Rol } from '../../entities/rol.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
export declare class UsersService {
    private empleadoRepository;
    private usuarioRepository;
    private rolRepository;
    private auditRepository;
    private dataSource;
    constructor(empleadoRepository: Repository<Empleado>, usuarioRepository: Repository<Usuario>, rolRepository: Repository<Rol>, auditRepository: Repository<AuditLog>, dataSource: DataSource);
    findAllEmpleados(activo?: string): Promise<any>;
    getMyProfile(empleadoId: number): Promise<{
        empleadoId: any;
        codigoEmpleado: any;
        nombres: any;
        apellidos: any;
        nombreCompleto: string;
        email: any;
        telefono: any;
        fechaIngreso: any;
        departamento: any;
        puesto: any;
        tarifaHora: any;
        roles: any;
    }>;
    findEmpleadoById(id: number): Promise<{
        empleadoId: any;
        codigoEmpleado: any;
        nombres: any;
        apellidos: any;
        nombreCompleto: string;
        email: any;
        telefono: any;
        fechaIngreso: any;
        activo: any;
        departamento: any;
        puesto: any;
        tarifaHora: any;
        supervisorId: any;
        roles: any;
    }>;
    createEmpleado(createEmpleadoDto: CreateEmpleadoDto, usuarioId: number): Promise<{
        empleadoId: any;
        codigoEmpleado: any;
        nombres: any;
        apellidos: any;
        nombreCompleto: string;
        email: any;
        telefono: any;
        fechaIngreso: any;
        activo: any;
        departamento: any;
        puesto: any;
        tarifaHora: any;
        supervisorId: any;
        roles: any;
    }>;
    updateEmpleado(id: number, updateEmpleadoDto: UpdateEmpleadoDto, usuarioId: number): Promise<{
        empleadoId: any;
        codigoEmpleado: any;
        nombres: any;
        apellidos: any;
        nombreCompleto: string;
        email: any;
        telefono: any;
        fechaIngreso: any;
        activo: any;
        departamento: any;
        puesto: any;
        tarifaHora: any;
        supervisorId: any;
        roles: any;
    }>;
    deactivateEmpleado(id: number, usuarioId: number): Promise<{
        message: string;
    }>;
    createUsuario(empleadoId: number, createUsuarioDto: CreateUsuarioDto, usuarioId: number): Promise<{
        usuarioId: number;
        empleadoId: number;
        username: string;
        estado: string;
        roles: string[];
    }>;
    updateUsuario(empleadoId: number, updateUsuarioDto: UpdateUsuarioDto, usuarioId: number): Promise<{
        usuarioId: number;
        username: string;
        estado: string;
        roles: string[];
    }>;
    getEquipoBySupervisor(supervisorId: number): Promise<any>;
}
