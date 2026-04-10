import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsArray()
  @IsOptional()
  rolIds?: number[];

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateUsuarioDto {
  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsArray()
  @IsOptional()
  rolIds?: number[];
}
