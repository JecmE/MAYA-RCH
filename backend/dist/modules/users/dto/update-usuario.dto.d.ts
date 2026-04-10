export declare class CreateUsuarioDto {
    username: string;
    rolIds?: number[];
    password: string;
}
export declare class UpdateUsuarioDto {
    password?: string;
    estado?: string;
    rolIds?: number[];
}
