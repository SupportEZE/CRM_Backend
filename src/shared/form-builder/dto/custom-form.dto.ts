import { IsEnum, IsString, IsNotEmpty, IsArray, IsNumber, IsOptional } from 'class-validator';

export class CreateCustomFormDto {

  @IsEnum(['app', 'web'])
  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsNumber()
  @IsNotEmpty()
  form_id: number;

  @IsString()
  @IsNotEmpty()
  form_name: string;

  @IsArray()
  @IsNotEmpty()
  form_data: Record<string, any>;

  @IsEnum(['edit', 'add'])
  @IsNotEmpty()
  form_type: string;

}
export class ReadFormsDto {

  @IsNumber()
  @IsOptional()
  org_id: number;


  @IsNumber()
  @IsNotEmpty()
  form_id: number;
}
export class MergeFormDto {
  @IsNumber()
  @IsNotEmpty()
  module_id: number;
}
