import { IsNumber, IsOptional, IsString, Min, IsObject, IsNotEmpty, IsEnum, IsMongoId, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Status {
  Pending = "Pending",
  Approved = "Approved",
  Reject = "Reject",
  Complete = "Complete",
}
export class CreateBrandRequestDto {
  
  @ApiProperty({ example: "60d21b4667d0d8992e610c85", description: "Customer Type Id", required: true })
  @IsMongoId()
  @IsNotEmpty()
  customer_type_id: string;
  
  @ApiProperty({ example: "Distributor", description: "Customer Type Name", required: true })
  @IsString()
  @IsNotEmpty()
  customer_type_name: string;
  
  @ApiProperty({ example: "60d21b4667d0d8992e610c85", description: "Customer Id", required: true })
  @IsMongoId()
  @IsNotEmpty()
  customer_id: string;
  
  @ApiProperty({ example: "Test Distributor", description: "Customer Name", required: true })
  @IsString()
  @IsNotEmpty()
  customer_name: string;
  
  @ApiProperty({ example: "Connection Pipe 36 inch SS", description: "Product Name", required: true })
  @IsString()
  @IsNotEmpty()
  branding_product: string;
  
  @ApiProperty({ example: "Testing remark", description: "Reamrk", required: true })
  @IsString()
  @IsNotEmpty()
  remark: string;
  
  @ApiProperty({ description: 'form_data ia a form builder part go here and this is an optional field', required: false })
  @IsObject()
  @IsOptional()
  form_data?: Record<string, any>;
}

export class ReadBrandRequestDto {
  @ApiPropertyOptional({ type: Object, description: 'Filter options for reading stock audit data' })
  @IsOptional()
  @IsObject()
  filters: object;
  
  @ApiProperty({ example: 'Reject', description: 'Tab filter: Reject / Verified', required: false })
  @IsNotEmpty()
  @IsString()
  activeTab?: string;
  
  @ApiPropertyOptional({ type: Object, description: 'Sorting options' })
  @IsOptional()
  @IsObject()
  sorting: object;
  
  @ApiPropertyOptional({ type: Number, description: 'Page number for pagination (min: 1)', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;
  
  @ApiPropertyOptional({ type: Number, description: 'Number of records per page (min: 10)', minimum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;
}

export class DetailBrandRequestDto {
  @ApiProperty({ example: "60d21b4667d0d8992e610c85", description: "Payment ID", required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}

export class StatusDto {
  
  @ApiProperty({ example: "60d21b4667d0d8992e610c85", description: "Status Update", required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;
  
  @ApiProperty({ example: "Approved,Reject,Pending", description: "Status Update", required: true })
  @IsNotEmpty()
  @IsEnum(Status)
  status: Status;
  
  @ValidateIf((o) => o.status === Status.Reject)
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class BrandDocsDto {
  @ApiProperty({
    description: 'Unique identifier for the payment',
    example: '609e126f61e3e53b7c2d672c',
  })
  @IsMongoId()
  @IsNotEmpty()
  _id: string;
}