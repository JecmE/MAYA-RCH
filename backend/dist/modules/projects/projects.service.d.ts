import { Repository } from 'typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { AuditLog } from '../../entities/audit-log.entity';
export declare class ProjectsService {
    private proyectoRepository;
    private auditRepository;
    constructor(proyectoRepository: Repository<Proyecto>, auditRepository: Repository<AuditLog>);
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
    create(createDto: any, usuarioId: number): Promise<{
        proyectoId: number;
        codigo: string;
        nombre: string;
        descripcion: string;
        departamentoId: number;
        activo: boolean;
    }>;
    update(id: number, updateDto: any, usuarioId: number): Promise<{
        proyectoId: number;
        codigo: string;
        nombre: string;
        descripcion: string;
        departamentoId: number;
        activo: boolean;
    }>;
    deactivate(id: number, usuarioId: number): Promise<{
        message: string;
    }>;
}
