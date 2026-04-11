export declare class CreateEmpleadoDto {
    codigoEmpleado: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono?: string;
    fechaIngreso: string;
    supervisorId?: number;
    puesto?: string;
    tarifaHora?: number;
    departamento?: string;
}
export declare class UpdateEmpleadoDto {
    codigoEmpleado?: string;
    nombres?: string;
    apellidos?: string;
    email?: string;
    telefono?: string;
    fechaIngreso?: string;
    supervisorId?: number;
    departamento?: string;
    puesto?: string;
    tarifaHora?: number;
}
