import { Repository, DataSource } from 'typeorm';
import { Empleado } from '../../entities/empleado.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Rol } from '../../entities/rol.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersService {
    private empleadoRepository;
    private usuarioRepository;
    private rolRepository;
    private auditRepository;
    private dataSource;
    constructor(empleadoRepository: Repository<Empleado>, usuarioRepository: Repository<Usuario>, rolRepository: Repository<Rol>, auditRepository: Repository<AuditLog>, dataSource: DataSource);
    private sanitizeString;
    findAllEmpleados(activo?: string): Promise<{
        empleadoId: number;
        codigoEmpleado: string;
        nombres: string;
        apellidos: string;
        nombreCompleto: string;
        email: string;
        telefono: string;
        fechaIngreso: Date;
        activo: boolean;
        departamento: string;
        puesto: string;
        supervisorId: number;
    }[]>;
    getMyProfile(empleadoId: number): Promise<{
        empleadoId: number;
        codigoEmpleado: string;
        nombres: string;
        apellidos: string;
        nombreCompleto: string;
        email: string;
        telefono: string;
        fechaIngreso: Date;
        departamento: string;
        puesto: string;
        tarifaHora: number;
        roles: string[];
    }>;
    findEmpleadoById(id: number): Promise<{
        empleadoId: number;
        codigoEmpleado: string;
        nombres: string;
        apellidos: string;
        nombreCompleto: string;
        email: string;
        telefono: string;
        fechaIngreso: Date;
        activo: boolean;
        departamento: string;
        puesto: string;
        tarifaHora: number;
        supervisorId: number;
        roles: string[];
    }>;
    createEmpleado(createEmpleadoDto: CreateEmpleadoDto, usuarioId: number): Promise<{
        empleadoId: number;
        codigoEmpleado: string;
        nombres: string;
        apellidos: string;
        nombreCompleto: string;
        email: string;
        telefono: string;
        fechaIngreso: Date;
        activo: boolean;
        departamento: string;
        puesto: string;
        tarifaHora: number;
        supervisorId: number;
        roles: string[];
    }>;
    updateEmpleado(id: number, updateEmpleadoDto: UpdateEmpleadoDto, usuarioId: number): Promise<{
        empleadoId: number;
        codigoEmpleado: string;
        nombres: string;
        apellidos: string;
        nombreCompleto: string;
        email: string;
        telefono: string;
        fechaIngreso: Date;
        activo: boolean;
        departamento: string;
        puesto: string;
        tarifaHora: number;
        supervisorId: number;
        roles: string[];
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
    changePassword(usuarioId: number, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getEquipoBySupervisor(supervisorId: number): Promise<{
        empleadoId: number;
        codigoEmpleado: string;
        nombres: string;
        apellidos: string;
        nombreCompleto: string;
        email: string;
        departamento: string;
        puesto: string;
        activo: boolean;
    }[]>;
}
