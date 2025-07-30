import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber, IsObject, Min, IsArray, MIN } from 'class-validator';

export class CreateCustomerTypeDto {
  @IsNotEmpty()
  @IsNumber()
  login_type_id: number;

  @IsNotEmpty()
  @IsString()
  login_type_name: string;

  @IsNotEmpty()
  @IsString()
  customer_type_name: string;

  @IsOptional()
  @IsBoolean()
  is_checkin?: boolean;

  @IsOptional()
  @IsBoolean()
  is_order?: boolean;

  @IsOptional()
  @IsBoolean()
  is_followup?: boolean;

  @IsOptional()
  @IsBoolean()
  is_travel_plan?: boolean;
}

export class ReadCustomerTypeDto {

  @IsString()
  app_id: string;

  @IsString()
  platform: string;

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
}


export class ReadDropdownDto {
  @IsOptional()
  @IsNumber()
  login_type_id: number;

  @IsOptional()
  @IsArray()
  login_type_ids: Record<string, any>;
}
