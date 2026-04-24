import { OnModuleInit } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { EmpleadoProyecto } from '../../entities/empleado-proyecto.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Empleado } from '../../entities/empleado.entity';
export declare class ProjectsService implements OnModuleInit {
    private proyectoRepository;
    private empProyRepository;
    private empleadoRepository;
    private auditRepository;
    private dataSource;
    constructor(proyectoRepository: Repository<Proyecto>, empProyRepository: Repository<EmpleadoProyecto>, empleadoRepository: Repository<Empleado>, auditRepository: Repository<AuditLog>, dataSource: DataSource);
    onModuleInit(): Promise<void>;
    private ensureResponsableColumnExists;
    findAll(): Promise<{
        proyectoId: number;
        codigo: string;
        nombre: string;
        descripcion: string;
        responsable: string;
        activo: boolean;
        totalEmpleados: number;
        horasAcumuladas: number;
    }[]>;
    findMyProjects(empleadoId: number): Promise<{
        proyectoId: number;
        codigo: string;
        nombre: string;
        activo: boolean;
    }[]>;
    findOne(id: number): Promise<{
        horasAcumuladas: number;
        asignaciones: {
            empProyId: number;
            empleadoId: number;
            nombreCompleto: string;
            fechaInicio: Date;
            fechaFin: Date;
            activo: boolean;
        }[];
        proyectoId: number;
        departamentoId: number;
        codigo: string;
        nombre: string;
        descripcion: string;
        responsable: string;
        activo: boolean;
        departamento: import("../../entities").Departamento;
        empleadoProyectos: EmpleadoProyecto[];
        registrosTiempo: import("../../entities").RegistroTiempo[];
    }>;
    create(createDto: any, usuarioId: number): Promise<{
        horasAcumuladas: number;
        asignaciones: {
            empProyId: number;
            empleadoId: number;
            nombreCompleto: string;
            fechaInicio: Date;
            fechaFin: Date;
            activo: boolean;
        }[];
        proyectoId: number;
        departamentoId: number;
        codigo: string;
        nombre: string;
        descripcion: string;
        responsable: string;
        activo: boolean;
        departamento: import("../../entities").Departamento;
        empleadoProyectos: EmpleadoProyecto[];
        registrosTiempo: import("../../entities").RegistroTiempo[];
    }>;
    update(id: number, updateDto: any, usuarioId: number): Promise<{
        horasAcumuladas: number;
        asignaciones: {
            empProyId: number;
            empleadoId: number;
            nombreCompleto: string;
            fechaInicio: Date;
            fechaFin: Date;
            activo: boolean;
        }[];
        proyectoId: number;
        departamentoId: number;
        codigo: string;
        nombre: string;
        descripcion: string;
        responsable: string;
        activo: boolean;
        departamento: import("../../entities").Departamento;
        empleadoProyectos: EmpleadoProyecto[];
        registrosTiempo: import("../../entities").RegistroTiempo[];
    }>;
    assignEmployee(dto: any, usuarioId: number): Promise<{
        horasAcumuladas: number;
        asignaciones: {
            empProyId: number;
            empleadoId: number;
            nombreCompleto: string;
            fechaInicio: Date;
            fechaFin: Date;
            activo: boolean;
        }[];
        proyectoId: number;
        departamentoId: number;
        codigo: string;
        nombre: string;
        descripcion: string;
        responsable: string;
        activo: boolean;
        departamento: import("../../entities").Departamento;
        empleadoProyectos: EmpleadoProyecto[];
        registrosTiempo: import("../../entities").RegistroTiempo[];
    }>;
    unassignEmployee(empProyId: number, usuarioId: number): Promise<{
        message: string;
    }>;
    deactivate(id: number, usuarioId: number): Promise<{
        message: string;
    }>;
    getAdminStaff(): Promise<{
        empleadoId: number;
        nombreCompleto: string;
    }[]>;
    private sanitizeString;
}
