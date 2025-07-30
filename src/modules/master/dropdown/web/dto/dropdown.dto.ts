import { IsString, IsNumber, IsOptional, MaxLength, Min, IsObject, isNotEmpty, IsNotEmpty, IsEnum, IsArray, ValidateIf, IsMongoId } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ModuleType {
  Parent = 'parent',
  Child = 'child',
}

export class CreateDropdownDto {
  @ApiProperty({
    description: 'ID of the module associated with the dropdown',
    type: Number,
    example: 101,
  })
  @IsNumber()
  @IsNotEmpty()
  module_id: number;

  @ApiProperty({
    description: 'Name of the module associated with the dropdown',
    type: String,
    maxLength: 100,
    example: 'User Management',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  module_name: string;

  @ApiProperty({
    description: 'Type of the module (parent or child)',
    enum: ModuleType,
    example: 'parent',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(ModuleType)
  module_type: string;

  @ApiProperty({
    description: 'Name of the dropdown',
    type: String,
    maxLength: 100,
    example: 'User Roles',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  dropdown_name: string;

  @ApiProperty({
    description: 'Display Name of the dropdown',
    type: String,
    maxLength: 100,
    example: 'User Roles',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  dropdown_display_name: string;

  @ApiPropertyOptional({
    description: 'Name of the dependent dropdown',
    type: String,
    maxLength: 100,
    example: 'Category',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  dependent_dropdown_name: string;
}

export class ReadDropdownDto {
  @ApiProperty({
    description: 'ID of the module to fetch dropdowns for',
    type: Number,
    example: 101,
  })
  @IsNotEmpty()
  @IsNumber()
  module_id: number;
}

export enum Action {
  Basic = 'Basic',
  Delete = 'Delete',
}

export class UpdateDropdownDto {
  @ApiProperty({
    description: 'New name for the dropdown (if updating)',
    type: String,
    maxLength: 100,
    example: 'Admin Roles',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  dropdown_name: string;

  @ApiProperty({
    description: 'New name for the dropdown (if updating)',
    type: String,
    maxLength: 100,
    example: 'Admin Roles',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  dropdown_display_name?: string;
}

export class DeleteDropdownDto {
  @ApiProperty({
    description: 'name of the dropdown',
    type: String,
    maxLength: 100,
    example: 'category',
  })
  @IsNotEmpty()
  @IsString()
  dropdown_name: string;

  @ApiProperty({
    description: 'module id',
    type: String,
    example: 2,
  })
  @IsNotEmpty()
  @IsNumber()
  module_id: number;

  @ApiProperty({
    description: 'module type',
    type: String,
    example: 'parent',
  })
  @IsNotEmpty()
  @IsString()
  module_type: string;
}


