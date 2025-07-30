import { IsNumber, IsOptional, IsString, Min, IsObject, IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateBrandAuditDto {
  
  @ApiProperty({ description: 'Customer Type Id', example: '67b233420eb680e96a6fdcb2', required: true })
  @IsMongoId()
  @IsNotEmpty()
  customer_type_id: string;
  
  @ApiProperty({ description: 'Customer Type Name', example: 'Distributor', required: true })
  @IsString()
  @IsNotEmpty()
  customer_type_name: string;
  
  @ApiProperty({ description: 'Customer Id', example: '67b233420eb680e96a6fdcb2', required: true })
  @IsMongoId()
  @IsNotEmpty()
  customer_id: string;
  
  @ApiProperty({ description: 'Customer Name', example: '67b233420eb680e96a6fdcb2', required: true })
  @IsString()
  @IsNotEmpty()
  customer_name: string;
  
  @ApiProperty({ description: 'Competitor Name', example: 'Test', required: true })
  @IsString()
  @IsNotEmpty()
  competitors: string;
  
  @ApiProperty({ description: 'Remark', example: 'Test Remark', required: true })
  @IsString()
  @IsNotEmpty()
  remark: string;
  
  @ApiProperty({ description: 'form_data ia a form builder part go here and this is an optional field', required: false })
  @IsObject()
  @IsOptional()
  form_data?: Record<string, any>;
  
  @ApiPropertyOptional({ description: 'chekin-id' })
  @IsMongoId()
  @IsOptional()
  visit_activity_id: string;
  
}

export class ReadBrandAuditDto {
  @ApiPropertyOptional({ description: 'Filters for querying stock audits', type: Object })
  @IsOptional()
  @IsObject()
  filters: object;
  
  @ApiProperty({ example: 'Reject', description: 'Tab filter: Reject / Verified', required: false })
  @IsOptional()
  @IsString()
  activeTab?: string;
  
  @ApiPropertyOptional({ description: 'Page number for pagination', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;
  
  @ApiPropertyOptional({ description: 'Number of records per page', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class DetailBrandAuditDto {
  
  @ApiProperty({
    description: 'MongoDB ObjectId of the Brand Audit',
    required: true,
    example: '603d2149e1c1f001540b7a7d',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}


