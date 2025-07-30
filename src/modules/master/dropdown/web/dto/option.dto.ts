import { IsString, IsNumber, IsOptional, MaxLength, Min, IsObject, isNotEmpty, IsNotEmpty, IsEnum, IsArray, ValidateIf, IsMongoId, Equals } from 'class-validator';


export enum ModuleType {
  Parent = 'parent',
  Child = 'child',
}
export class CreateOptionDto {

  @IsNumber()
  @IsNotEmpty()
  module_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  module_name: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(ModuleType)
  module_type: string;

  @IsMongoId()
  @IsNotEmpty()
  dropdown_id: string;

  @IsString()
  @IsNotEmpty()
  dropdown_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  option_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  dependent_option_name: string;
}

export class ReadOptionDto {

  @IsOptional()
  @IsObject()
  filters: object;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;

  @IsNotEmpty()
  @IsMongoId()
  dropdown_id: string;
}



export class DeleteOptionDto {

  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @IsNotEmpty()
  @IsNumber()
  @Equals(1, { message: 'is_delete must be 1' })
  is_delete: number;

}

export class ReadOptionDropdownDto {

  @IsOptional()
  @IsObject()
  filters: object;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  module_id: number;

  @IsNotEmpty()
  @IsString()
  dropdown_name: string;

  @IsOptional()
  @IsString()
  dropdown_option: string;
}


