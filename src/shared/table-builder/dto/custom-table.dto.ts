import { IsEnum, IsObject, MaxLength, IsNotEmpty, IsOptional, IsNumber, IsArray, IsString } from 'class-validator';

export class CreateCustomTableDto {
  @IsEnum(['app', 'web'])
  @IsNotEmpty()
  @MaxLength(20)
  platform: string;

  @IsNumber()
  @IsNotEmpty()
  table_id: number;

  @IsNumber()
  @IsNotEmpty()
  form_id: number;

  @IsString()
  @IsNotEmpty()
  form_name: string;

  @IsObject()
  @IsNotEmpty()
  table_data: Record<string, any>;

}


export enum Platform {
  App = 'app',
  Web = 'web',
}

export class ReadTableDto {
  @IsEnum(Platform)
  @IsNotEmpty()
  @MaxLength(20)
  platform: Platform;

  @IsNumber()
  @IsNotEmpty()
  table_id: number;

  @IsNumber()
  @IsOptional()
  form_id: number;

}

export enum Level {
  one = 1,
  two = 2,
}

export class CreateHeaderDto {

  @IsEnum(Level)
  @IsNotEmpty()
  @IsNumber()
  level: Level;

  @IsNotEmpty()
  user_id: string;

  @IsNumber()
  @IsNotEmpty()
  table_id: number;

  @IsNotEmpty()
  @MaxLength(50)
  field_name: string;
}

export class ReadHeaderDto {

  @IsEnum(Platform)
  @IsNotEmpty()
  @MaxLength(20)
  platform: Platform;

  @IsNumber()
  @IsNotEmpty()
  form_id: number;

  @IsNumber()
  @IsNotEmpty()
  table_id: number;

}
