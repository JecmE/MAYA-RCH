import { UsersService } from './users.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(activo?: string): Promise<{
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
    getMyProfile(req: any): Promise<{
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
    updateMyProfile(req: any, updateDto: UpdateEmpleadoDto): Promise<{
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
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    findOne(id: number): Promise<{
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
    create(createEmpleadoDto: CreateEmpleadoDto, req: any): Promise<{
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
    update(id: number, updateEmpleadoDto: UpdateEmpleadoDto, req: any): Promise<{
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
    deactivate(id: number, req: any): Promise<{
        message: string;
    }>;
    createUsuario(id: number, createUsuarioDto: CreateUsuarioDto, req: any): Promise<{
        usuarioId: number;
        empleadoId: number;
        username: string;
        estado: string;
        roles: string[];
    }>;
    updateUsuario(id: number, updateUsuarioDto: UpdateUsuarioDto, req: any): Promise<{
        usuarioId: number;
        username: string;
        estado: string;
        roles: string[];
    }>;
    getEquipo(id: number): Promise<{
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
