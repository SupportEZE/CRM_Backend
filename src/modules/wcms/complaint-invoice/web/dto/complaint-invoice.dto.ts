import {
  IsString, IsOptional, IsMongoId, IsNotEmpty,
  IsNumber,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  IsObject,
  Min
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SeriveType {
  Customer = 'Installation',
  Enquiry = 'Complaint'
}
export enum ComplaintInvoiceStatus {
  Paid = 'Paid',
  Unpaid = 'Unpaid',
  Cancel = 'Cancel',
}
export class CreateComplaintInvoiceDto {
  @ApiProperty({ description: 'Complaint Id', example: '683aece855fcb2ea735e9e73' })
  @IsNotEmpty()
  @IsMongoId()
  complaint_id: string;

  @ApiProperty({ example: "Online/Cash", description: "Payment Mode", required: true })
  @IsNotEmpty()
  @IsString()
  payment_mode: string;

  @ApiProperty({ example: "987687tuknb@ybl", description: "Transaction Number", required: true })
  @IsOptional()
  @IsString()
  transaction_number: string;

  @ApiProperty({ example: "Online/Cash", description: "Payment Mode", required: true })
  @IsNotEmpty()
  @IsString()
  service_type: string;

  @ApiProperty({ description: 'Total Quantity', example: '55' })
  @IsNotEmpty()
  @IsNumber()
  total_qty: number;

  @ApiProperty({ description: 'Total Items', example: '1' })
  @IsNotEmpty()
  @IsNumber()
  total_items: number;

  @ApiProperty({ description: 'Sub Amount', example: '100' })
  @IsNotEmpty()
  @IsNumber()
  sub_total: number;

  @ApiProperty({ description: 'Total Discount', example: '100' })
  @IsNotEmpty()
  @IsNumber()
  total_discount: number;

  @ApiProperty({ description: 'Net Amount', example: '100' })
  @IsNotEmpty()
  @IsNumber()
  net_amount: number;

  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  @IsArray()
  @ArrayMinSize(1)
  item: ItemDto[];
}
export class ItemDto {
  @ApiProperty({ description: 'Product Id', example: '68259e1e6f5409e0f786601d' })
  @IsNotEmpty()
  @IsMongoId()
  product_id: string;

  @ApiProperty({ description: 'Product Name', example: 'CONCEALED STOP COCK 15 X 20 MM (LIGHT REGULAR)' })
  @IsNotEmpty()
  @IsString()
  product_name: string;

  @ApiProperty({ description: 'Product Code', example: 'ALL-2050' })
  @IsNotEmpty()
  @IsString()
  product_code: string;

  @ApiProperty({ description: 'Quantity', example: 55 })
  @IsNotEmpty()
  @IsNumber()
  qty: number;

  @ApiProperty({ description: 'MRP', example: 10 })
  @IsNotEmpty()
  @IsNumber()
  mrp: number;

  @ApiProperty({ description: 'Item Wise Sub Total', example: 100 })
  @IsNotEmpty()
  @IsNumber()
  discount: number;

  @ApiProperty({ description: 'Item Wise Sub Total', example: 100 })
  @IsNotEmpty()
  @IsNumber()
  sub_total: number;

  @ApiProperty({ description: 'Total Price Item Wise', example: 100 })
  @IsNotEmpty()
  @IsNumber()
  net_price: number;
}
export class ReadComplaintInvoiceDto {
  @ApiProperty({ description: 'Active tab (optional)', required: false })
  @IsOptional()
  @IsString()
  activeTab: string;

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