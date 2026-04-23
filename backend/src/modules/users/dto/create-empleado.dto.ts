import { IsString, IsEmail, IsOptional, IsNumber, IsDateString, IsBoolean } from 'class-validator';

export class CreateEmpleadoDto {
  @IsString()
  codigoEmpleado: string;

  @IsString()
  nombres: string;

  @IsString()
  apellidos: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsDateString()
  fechaIngreso: string;

  @IsNumber()
  @IsOptional()
  supervisorId?: number;

  @IsString()
  @IsOptional()
  departamento?: string;

  @IsString()
  @IsOptional()
  puesto?: string;

  @IsNumber()
  @IsOptional()
  tarifaHora?: number;

  @IsNumber()
  @IsOptional()
  departamentoId?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
