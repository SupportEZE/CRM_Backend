import { IsString, IsInt, IsNotEmpty, IsEnum, ValidateIf, IsMongoId, IsOptional, IsObject } from 'class-validator';

export enum FormActionEnum {
  ADD = 'created',
  UPDATE = 'updated',
  DELETE = 'deleted',
}

export enum ModuleTypeEnum {
  PARENT = 'parent',
  CHILD = 'child',
}

export enum ModuleTransactionEnum {
  IMPORT = 'import',
  EXPORT = 'export',
  DELETE = 'delete',
  UPDATE = 'update',
  UPDATE_MANY = 'updateMany',
  ADD = 'add',
}

export class FormLogDto {

  @IsEnum(FormActionEnum)
  @IsNotEmpty()
  action: FormActionEnum;

  @IsInt()
  @IsNotEmpty()
  module_id: number;

  @IsString()
  @IsNotEmpty()
  module_name: string;

  @IsEnum(ModuleTypeEnum)
  @IsNotEmpty()
  module_type: ModuleTypeEnum;

  @IsInt()
  @IsNotEmpty()
  form_id: number;

  @IsString()
  @IsOptional()
  form_name: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}


export class ModuleTransactionLogDto {

  @IsInt()
  @IsNotEmpty()
  module_id: number;

  @IsString()
  @IsNotEmpty()
  module_name: string;

  @IsEnum(ModuleTypeEnum)
  @IsNotEmpty()
  module_type: ModuleTypeEnum;

  @IsEnum(ModuleTransactionEnum)
  @IsNotEmpty()
  action: ModuleTransactionEnum;

  @IsString()
  @IsOptional()
  message: string;

  @ValidateIf((o) => o.action === (ModuleTransactionEnum.UPDATE || ModuleTransactionEnum.UPDATE_MANY))
  @IsObject()
  @IsOptional()
  changes?: string;

  @ValidateIf((o) => o.action === ModuleTransactionEnum.UPDATE)
  @IsNotEmpty()
  @IsMongoId({ each: true })
  row_id?: string | string[];
}

export class RealLogDto {

  @IsInt()
  @IsNotEmpty()
  module_id: number;

  @IsInt()
  @IsOptional()
  form_id: number;

  @IsString()
  @IsOptional()
  row_id: string;

  @IsEnum(ModuleTypeEnum)
  @IsNotEmpty()
  module_type: ModuleTypeEnum;

}
