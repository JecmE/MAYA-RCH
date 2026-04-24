import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    findAll(req: any): Promise<{
        proyectoId: number;
        codigo: string;
        nombre: string;
        activo: boolean;
    }[]>;
    getAdminStaff(): Promise<{
        empleadoId: number;
        nombreCompleto: string;
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
        empleadoProyectos: import("../../entities").EmpleadoProyecto[];
        registrosTiempo: import("../../entities").RegistroTiempo[];
    }>;
    create(createDto: any, req: any): Promise<{
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
        empleadoProyectos: import("../../entities").EmpleadoProyecto[];
        registrosTiempo: import("../../entities").RegistroTiempo[];
    }>;
    update(id: number, updateDto: any, req: any): Promise<{
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
        empleadoProyectos: import("../../entities").EmpleadoProyecto[];
        registrosTiempo: import("../../entities").RegistroTiempo[];
    }>;
    assignEmployee(dto: any, req: any): Promise<{
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
        empleadoProyectos: import("../../entities").EmpleadoProyecto[];
        registrosTiempo: import("../../entities").RegistroTiempo[];
    }>;
    unassignEmployee(empProyId: number, req: any): Promise<{
        message: string;
    }>;
    deactivate(id: number, req: any): Promise<{
        message: string;
    }>;
}
