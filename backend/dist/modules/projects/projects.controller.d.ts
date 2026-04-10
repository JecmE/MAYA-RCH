import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    findAll(): Promise<{
        proyectoId: number;
        codigo: string;
        nombre: string;
        descripcion: string;
        departamentoId: number;
        activo: boolean;
    }[]>;
    findOne(id: number): Promise<{
        proyectoId: number;
        codigo: string;
        nombre: string;
        descripcion: string;
        departamentoId: number;
        activo: boolean;
    }>;
    create(createDto: any, req: any): Promise<{
        proyectoId: number;
        codigo: string;
        nombre: string;
        descripcion: string;
        departamentoId: number;
        activo: boolean;
    }>;
    update(id: number, updateDto: any, req: any): Promise<{
        proyectoId: number;
        codigo: string;
        nombre: string;
        descripcion: string;
        departamentoId: number;
        activo: boolean;
    }>;
    deactivate(id: number, req: any): Promise<{
        message: string;
    }>;
}
