import { Equals, IsArray, IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TargetTypeEnum {
    CUSTOMER = 'Customer',
    FIELD_USER = 'Field User',
}

export enum ActiveTabEnum {
    OVERVIEW = 'Overview',
    DETAIL = 'Detail',
    TIMELINE = 'Timeline'
}

export class CreateTargetDto {
    
    @ApiProperty({ description: 'Target type', example: 'Customers' })
    @IsNotEmpty()
    @IsMongoId()
    assign_to_id: string;
    
    @ApiProperty({ description: 'Title', example: 'Target Due' })
    @IsNotEmpty()
    @IsString()
    assign_to_name: string;
    
    @ApiProperty({ description: 'Start date', example: '2025-04-01T00:00:00.000Z' })
    @IsNotEmpty()
    @IsString()
    start_date: string;
    
    @ApiProperty({ description: 'End date', example: '2025-05-01T00:00:00.000Z' })
    @IsNotEmpty()
    @IsString()
    end_date: string;
    
    @ApiProperty({ description: 'Title', example: 'Target Due' })
    @IsNotEmpty()
    @IsString()
    title: string;
    
    @ApiProperty({ description: 'Target value', example: 10000})
    @IsOptional()
    @IsNumber()
    sale_value: number;
    
    @ApiProperty({ description: 'Flag to indicate if this is an additional target', example: true })
    @IsNotEmpty() 
    @IsBoolean()
    is_additional_target: boolean;
    
    @ApiProperty({ description: 'List of additional targets', type: Object, required: false })
    @ValidateIf((o) => o.is_additional_target === true)
    @IsNotEmpty({ message: 'additional_target is required.' })
    @IsArray()
    additional_target?: Record<string, any>;
    
    @ApiProperty({ example: "Admin", description: "Login Type Name", required: false })
    @IsNotEmpty() 
    @IsString()
    @IsEnum(TargetTypeEnum)
    target_type: TargetTypeEnum;
    
    @ApiProperty({ example: "60d21b4667d0d8992e610c85", description: "Customer Type ID", required: true })
    @ValidateIf((o) => o.target_type === TargetTypeEnum.CUSTOMER)
    @IsNotEmpty({ message: 'customer_type_id is required.' })
    customer_type_id: string;
    
    
}

export class ReadTargetDto {
    @ApiProperty({ description: 'Filter criteria', required: false, example: { status: 'approved' } })
    @IsOptional()
    @IsObject()
    filters: object;
    
    @ApiProperty({ description: 'Sorting criteria', required: false, example: { created_at: 'desc' } })
    @IsOptional()
    @IsObject()
    sorting: object;
    
    @ApiProperty({ description: 'Page number for pagination', example: 1, required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    page: number;
    
    @ApiProperty({ description: 'Limit per page', example: 10, required: false })
    @IsOptional()
    @IsNumber()
    @Min(10)
    limit: number;
}

export class UpdateTargetDto {
    @ApiProperty({ description: 'The ID of the row to update.' })
    @IsMongoId()
    _id: string;
    
    @ApiProperty({ description: 'Target type', example: 'Customers' })
    @IsNotEmpty()
    @IsMongoId()
    assign_to_id: string;
    
    @ApiProperty({ description: 'Target type name', example: 'Name' })
    @IsNotEmpty()
    @IsString()
    assign_to_name: string;
    
    @ApiProperty({ description: 'Start date', example: '2025-04-01T00:00:00.000Z' })
    @IsNotEmpty()
    @IsString()
    start_date: string;
    
    @ApiProperty({ description: 'End date', example: '2025-05-01T00:00:00.000Z' })
    @IsNotEmpty()
    @IsString()
    end_date: string;
    
    @ApiProperty({ description: 'Title', example: 'Target Due' })
    @IsNotEmpty()
    @IsString()
    title: string;
    
    @ApiProperty({ description: 'Target value', example: 10000})
    @IsNotEmpty()
    @IsNumber()
    sale_value: number;
    
    @ApiProperty({ description: 'Flag to indicate if this is an additional target', example: true })
    @IsNotEmpty() 
    @IsBoolean()
    is_additional_target: boolean;
    
    @ApiProperty({ description: 'List of additional targets', type: Object, required: false })
    @ValidateIf((o) => o.is_additional_target === true)
    @IsNotEmpty({ message: 'additional_target is required.' })
    @IsArray()
    additional_target?: Record<string, any>;
    
    @ApiProperty({ example: "Admin", description: "Login Type Name", required: false })
    @IsNotEmpty() 
    @IsString()
    @IsEnum(TargetTypeEnum)
    target_type?: TargetTypeEnum;
    
    @ApiProperty({ example: "60d21b4667d0d8992e610c85", description: "Customer Type ID", required: true })
    @IsMongoId()
    @IsNotEmpty()
    customer_type_id: string;
}

export class AchievementDto {
    
    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    assign_to_id: string;
    
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @IsEnum(TargetTypeEnum)
    target_type: TargetTypeEnum;
    
}

export class AppTargetReadDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @IsEnum(ActiveTabEnum, { message: 'activeTab must be one of: Overview, Detail, Timeline' })
    activeTab: ActiveTabEnum;
    
}