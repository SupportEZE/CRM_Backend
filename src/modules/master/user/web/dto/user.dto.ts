import {
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  IsEmail,
  Matches,
  IsEnum,
  IsNotEmpty,
  IsObject,
  ValidateIf,
  Min,
  IsArray,
  Equals,
  IsMongoId,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Status {
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum DataRights {
  STATE_WISE = 'State Wise',
  TEAM_WISE = 'Team Wise',
  DIRECT_ASSIGN = 'Direct Assign',
}

export enum WeeklyOff {
  Sunday = 'Sunday',
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
}
export class CreateUserDto {
  @ApiProperty({ description: 'Name of the user', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  name: string;

  @ApiProperty({ description: 'Login type ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  login_type_id: number;

  @ApiProperty({ description: 'Login type name', example: 'Admin' })
  @IsNotEmpty()
  @IsString()
  login_type_name: string;

  @ApiPropertyOptional({
    description: 'User role ID (required for login_type_id = 3)',
    example: '609d9e8f2f79981e9a1e233b',
  })
  @ValidateIf((o) => o.login_type_id === global.LOGIN_TYPE_ID['SYSTEM_USER'])
  @IsNotEmpty({ message: 'user_role_id is required' })
  @IsMongoId()
  user_role_id: string;

  @ApiPropertyOptional({
    description: 'User role name (required for login_type_id = 3)',
    example: 'Manager',
  })
  @ValidateIf((o) => o.login_type_id === global.LOGIN_TYPE_ID['SYSTEM_USER'])
  @IsNotEmpty({ message: 'user_role_name is required' })
  @IsString()
  user_role_name: string;

  @ApiProperty({
    description: 'Mobile number of the user',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  mobile: string;

  @ApiPropertyOptional({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  email?: string;

  @ApiProperty({ description: 'Unique user code', example: 'USR123' })
  @IsNotEmpty()
  @IsString()
  user_code: string;

  @ApiProperty({
    description: 'Designation of the user',
    example: 'Software Engineer',
  })
  @ValidateIf((o) => o.login_type_id === global.LOGIN_TYPE_ID['FIELD_USER'])
  @IsNotEmpty()
  @IsString()
  designation: string;

  @ApiProperty({
    description: 'Weekly off day for the user',
    example: 'Sunday',
  })
  @IsOptional()
  @IsEnum(WeeklyOff)
  weekly_off: WeeklyOff;

  @ApiPropertyOptional({
    description: 'Reporting manager ID (required for login_type_id = 4)',
    example: '609d9e8f2f79981e9a1e234c',
  })
  @ValidateIf((o) => o.login_type_id === global.LOGIN_TYPE_ID['FIELD_USER'])
  @IsOptional({ message: 'reporting_manager_id is required' })
  @IsMongoId()
  reporting_manager_id?: string;

  @ApiPropertyOptional({
    description: 'Reporting manager name (required for login_type_id = 4)',
    example: 'Jane Smith',
  })
  @ValidateIf((o) => o.login_type_id === global.LOGIN_TYPE_ID['FIELD_USER'])
  @IsOptional()
  @IsString()
  reporting_manager_name?: string;

  @ApiPropertyOptional({
    description: 'Data rights (required for login_type_id = 3)',
    enum: DataRights,
    example: DataRights.STATE_WISE,
  })
  @ValidateIf((o) => o.login_type_id === global.LOGIN_TYPE_ID['SYSTEM_USER'])
  @IsNotEmpty({ message: 'data_rights is required' })
  @IsString()
  @IsEnum(DataRights)
  data_rights?: string;

  @ApiPropertyOptional({
    description: 'Data right values (required for login_type_id = 3)',
    example: ['X', 'Y'],
  })
  @ValidateIf(
    (o) =>
      o.login_type_id === global.LOGIN_TYPE_ID['SYSTEM_USER'] &&
      o.data_rights !== DataRights.DIRECT_ASSIGN,
  )
  @IsNotEmpty({ message: 'data_right_values is required' })
  @IsArray()
  data_right_values?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Data right values Names(required for login_type_id = 3)',
    example: ['X', 'Y'],
  })
  @ValidateIf(
    (o) =>
      o.login_type_id === global.LOGIN_TYPE_ID['SYSTEM_USER'] &&
      o.data_rights !== DataRights.DIRECT_ASSIGN,
  )
  @IsNotEmpty({ message: 'data_right_value_name is required' })
  @IsArray()
  data_right_value_names?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Country of the user', example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'State of the user',
    example: 'California',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'District of the user',
    example: 'Los Angeles',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'City of the user',
    example: 'Los Angeles',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Pincode of the user', example: 90001 })
  @IsOptional()
  @IsNumber()
  pincode?: number;

  @ApiPropertyOptional({
    description: 'Address of the user',
    example: '123 Main St',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Additional form data',
    example: { customField: 'value' },
  })
  @IsObject()
  @IsOptional()
  form_data?: Record<string, any>;
}
export class ReadUserDto {
  @ApiPropertyOptional({
    description: 'Filters for querying users',
    example: { status: 'Active' },
  })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiPropertyOptional({
    description: 'Sorting options for querying users',
    example: { name: 'asc' },
  })
  @IsOptional()
  @IsObject()
  sorting: object;

  @ApiProperty({ description: 'Page number for pagination', example: 1 })
  @IsNumber()
  @Min(1)
  page: number;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;

  @ApiPropertyOptional({ description: 'login_type_id', example: 10 })
  @IsOptional()
  @IsNumber()
  login_type_id: number;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User ID',
    example: '609d9e8f2f79981e9a1e233b',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({ description: 'Name of the user', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  name: string;

  @ApiProperty({ description: 'Login type ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  login_type_id: number;

  @ApiProperty({ description: 'Login type name', example: 'Admin' })
  @IsNotEmpty()
  @IsString()
  login_type_name: string;

  @ApiPropertyOptional({
    description: 'User role ID (required for login_type_id = 3)',
    example: '609d9e8f2f79981e9a1e233b',
  })
  @ValidateIf((o) => o.login_type_id === 3)
  @IsNotEmpty({ message: 'user_role_id is required' })
  @IsMongoId()
  user_role_id: string;

  @ApiPropertyOptional({
    description: 'User role name (required for login_type_id = 3)',
    example: 'Manager',
  })
  @ValidateIf((o) => o.login_type_id === 3)
  @IsNotEmpty({ message: 'user_role_name is required' })
  @IsString()
  user_role_name: string;

  @ApiProperty({
    description: 'Mobile number of the user',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  mobile: string;

  @ApiPropertyOptional({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  email?: string;

  @ApiProperty({ description: 'Unique user code', example: 'USR123' })
  @IsNotEmpty()
  @IsString()
  user_code: string;

  @ApiProperty({
    description: 'Designation of the user',
    example: 'Software Engineer',
  })
  @IsNotEmpty()
  @IsString()
  designation: string;

  @ApiProperty({
    description: 'Weekly off day for the user',
    example: 'Sunday',
  })
  @IsOptional()
  @IsEnum(WeeklyOff)
  weekly_off: WeeklyOff;

  @ApiPropertyOptional({
    description: 'Reporting manager ID (required for login_type_id = 4)',
    example: '609d9e8f2f79981e9a1e234c',
  })
  @IsOptional()
  @IsMongoId()
  reporting_manager_id?: string;

  @ApiPropertyOptional({
    description: 'Reporting manager name (required for login_type_id = 4)',
    example: 'Jane Smith',
  })
  @IsOptional()
  @IsString()
  reporting_manager_name?: string;

  @ApiPropertyOptional({
    description: 'Data rights (required for login_type_id = 3)',
    enum: DataRights,
    example: DataRights.STATE_WISE,
  })
  @ValidateIf((o) => o.login_type_id === 3)
  @IsNotEmpty({ message: 'data_rights is required' })
  @IsString()
  @IsEnum(DataRights)
  data_rights?: string;

  @ApiPropertyOptional({
    description: 'Data right values (required for login_type_id = 3)',
    example: ['X', 'Y'],
  })
  @ValidateIf((o) => o.login_type_id === 3)
  @IsNotEmpty({ message: 'data_right_values is required' })
  @IsArray()
  data_right_values?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Country of the user', example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'State of the user',
    example: 'California',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'District of the user',
    example: 'Los Angeles',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'City of the user',
    example: 'Los Angeles',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Pincode of the user', example: 90001 })
  @IsOptional()
  @IsNumber()
  pincode?: number;

  @ApiPropertyOptional({
    description: 'Address of the user',
    example: '123 Main St',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Additional form data',
    example: { customField: 'value' },
  })
  @IsObject()
  @IsOptional()
  form_data?: Record<string, any>;
}

export class UserDropdownDto {
  @ApiPropertyOptional({
    description: 'Filters for querying users',
    example: { status: 'Active' },
  })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiPropertyOptional({
    description: 'Sorting options for querying users',
    example: { name: 'asc' },
  })
  @IsOptional()
  @IsObject()
  sorting: object;

  @ApiPropertyOptional({ description: 'login_type_ids', example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  login_type_ids: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;

  @ApiPropertyOptional({ description: 'user Name' })
  @IsOptional()
  @IsString()
  search: String;

  @ApiPropertyOptional({ description: 'user Id' })
  @IsOptional()
  @IsNotEmpty()
  user_id: String;
}

export class DesignationDropdownDto {
  @ApiPropertyOptional({
    description: 'Dropdown Name',
    example: { name: 'asc' },
  })
  @IsOptional()
  @IsString()
  dropdown_name: string;

  @ApiPropertyOptional({
    description: 'Filters for querying users',
    example: { status: 'Active' },
  })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiPropertyOptional({
    description: 'Sorting options for querying users',
    example: { name: 'asc' },
  })
  @IsOptional()
  @IsObject()
  sorting: object;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;

  @ApiPropertyOptional({ description: 'user Name' })
  @IsOptional()
  @IsString()
  search: String;
}

export class ReadDetailDto {
  @ApiProperty({ description: 'User ID', example: '609d9e8f2f79981e9a1e233b' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
}

export class DeleteUserDto {
  @ApiProperty({
    description: 'User ID to delete',
    example: '609d9e8f2f79981e9a1e233b',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({
    description: 'Flag to confirm deletion',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Equals(1, { message: 'is_delete must be 1' })
  is_delete: number;
}

export class UserStatusDto {
  @ApiProperty({ description: 'User ID', example: '609d9e8f2f79981e9a1e233b' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'state', example: { status: 'value' } })
  @IsNotEmpty()
  @IsString()
  @IsEnum(Status)
  status: Status;
}

export class DuplicateDto {
  @ApiProperty({ description: 'mobile', example: { mobile: 'value' } })
  @IsOptional()
  @IsString()
  mobile: string;

  @ApiProperty({ description: 'user_code', example: { user_code: 'value' } })
  @IsOptional()
  @IsString()
  user_code: string;
}
export class ReadDropdownDto {
  @ApiProperty({ example: '6,4', description: 'Customer type identifier.' })
  @IsNotEmpty()
  @IsArray()
  login_type_ids: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Search key for filtering dropdown options.',
  })
  @IsOptional()
  search_key: string;
}
export class AssignedUserToStateDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer type identifier',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  user_id: string;

  @ApiProperty({
    example: 'Sales User Name',
    description: 'Customer type identifier',
  })
  @IsNotEmpty()
  @IsString()
  user_name: string;

  @ApiProperty({
    description: 'List of states',
    example: ['DELHI', 'GOA'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  state: string[];

  @ApiProperty({
    description: 'List of districts',
    example: ['NORTH GOA', 'WEST'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  district: string[];
}

export class GetUsersByDesignationDto {
  @ApiProperty({
    description: 'Designation to filter users',
    example: 'Technical Team',
  })
  @IsString()
  @IsOptional()
  designation: string;

  @IsString()
  @IsOptional()
  user_role_name: string;

  @IsNumber()
  @IsOptional()
  login_type_id: string;
}
