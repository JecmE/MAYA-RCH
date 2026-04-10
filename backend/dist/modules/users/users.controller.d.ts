import { UsersService } from './users.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(activo?: string): Promise<any>;
    getMyProfile(req: any): Promise<{
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
    updateMyProfile(req: any, updateDto: UpdateEmpleadoDto): Promise<{
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
    findOne(id: number): Promise<{
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
    create(createEmpleadoDto: CreateEmpleadoDto, req: any): Promise<{
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
    update(id: number, updateEmpleadoDto: UpdateEmpleadoDto, req: any): Promise<{
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
    getEquipo(id: number): Promise<any>;
}
