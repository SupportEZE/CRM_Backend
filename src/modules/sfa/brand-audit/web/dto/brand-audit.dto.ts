import { IsNumber, IsOptional, IsString, Min, IsObject, IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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

}
export class ReadBrandAuditDto {
  @ApiProperty({ description: 'Optional parameter to filter.', required: false })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ description: 'For Pagination.', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiProperty({ description: 'For Pagination.', required: false })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;
}

export class DetailBrandAuditDto {
  @ApiProperty({ example: "60d21b4667d0d8992e610c85", description: "Brand Audit ID", required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}
