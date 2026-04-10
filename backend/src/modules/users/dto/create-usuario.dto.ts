import { IsString, IsNotEmpty, IsArray, ArrayMinSize, IsOptional } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  rolIds: number[];

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
