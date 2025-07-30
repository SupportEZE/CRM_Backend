import {
  IsString, IsNumber, IsOptional, Min, IsObject, IsMongoId, IsNotEmpty, IsEnum, ValidateIf, IsArray, ValidateNested,Equals
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AppCartItemDto {
  @ApiProperty({ description: 'Product ID', example: 'abcd1234' })
  @IsString()
  @IsMongoId()
  @IsNotEmpty()
  product_id: string;

  @ApiProperty({ description: 'Product name', example: 'iPhone 15' })
  @IsString()
  @IsNotEmpty()
  product_name: string;

  @ApiProperty({ description: 'Quantity of the product', example: 2 })
  @IsNumber()
  @IsNotEmpty()
  qty: number;

  @ApiProperty({ description: 'Price of the product', example: 50000 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ description: 'Discount on the product', example: 500, required: false })
  @IsNotEmpty()
  @IsNumber()
  total_price?: number;

  @ApiProperty({ description: 'Discount in Percentage', example: 500, required: false })
  @IsNotEmpty()
  @IsNumber()
  discount_percent?: number;

  @ApiProperty({ description: 'Discount Amount', example: 500, required: false })
  @IsNotEmpty()
  @IsNumber()
  discount_amount?: number;

  @ApiProperty({ description: 'Sub  Total of Item', example: 500, required: false })
  @IsNotEmpty()
  @IsNumber()
  sub_total?: number;

  @ApiProperty({ description: 'Net Amount', example: 500, required: false })
  @IsNotEmpty()
  @IsNumber()
  net_amount?: number;
}
export class AppCreateInvoiceDto {
  @ApiProperty({ description: 'Invoice title', example: 'New Invoice Add', required: true })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Invoice Id', example: 'Quo-0000001', required: true })
  @IsString()
  @IsOptional()
  Invoice_id: string;

  @ApiProperty({ description: 'Module ID', example: '4', required: false })
  @IsNumber()
  @IsNotEmpty()
  module_id: string;

  @ApiProperty({ description: 'Module Name', example: 'Customers', required: false })
  @IsString()
  @IsNotEmpty()
  module_name: string;

  @ApiProperty({ description: 'Customer ID', example: '67f40ee577c6fb24c6d1b367', required: false })
  @IsMongoId()
  @IsNotEmpty()
  customer_id: string;

  @ApiProperty({ description: 'Customer Name', example: 'ABC Company', required: false })
  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @ApiProperty({ description: 'Follow Up Date', required: false })
  @IsOptional()
  @IsString()
  followup_date?: string;

  @ApiProperty({ description: 'Sub Total', required: true })
  @IsNumber()
  @IsNotEmpty()
  sub_total: number;

  @ApiProperty({ description: 'Discount', example: 100, required: true })
  @IsNumber()
  @IsNotEmpty()
  total_discount: number;

  @ApiProperty({ description: 'GST Percentage', example: 200, required: true })
  @IsNumber()
  @IsNotEmpty()
  gst: number;

  @ApiProperty({ description: 'Total Amount', example: 200, required: true })
  @IsNumber()
  @IsNotEmpty()
  total_amount: number;

  @ApiProperty({ description: 'Status', example: 'draft', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Remark', example: 'ABC Remark', required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ description: 'Payment Term', example: 'Test', required: false })
  @IsOptional()
  @IsString()
  payment_term?: string;

  @ApiProperty({ description: 'Valid Up to Date', required: false })
  @IsOptional()
  @IsString()
  valid_upto?: string;

  @ApiProperty({
    description: 'Cart items as array of CartItemDto',
    type: [AppCartItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppCartItemDto)
  cart_item?: AppCartItemDto[];

}
export class AppReadInvoiceDto {

  @ApiProperty({ description: 'filters is an optional field', required: false })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ description: 'activeTab is an optional field', required: false })
  @IsOptional()
  @IsString()
  activeTab: string;

  @ApiProperty({ description: 'sorting is an optional field', required: false })
  @IsOptional()
  @IsObject()
  sorting: object;

  @ApiProperty({ description: 'page number is an optional field', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiProperty({ description: 'limit is an optional field', required: false })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;
}

export class AppInvoiceDetailDto {

  @ApiProperty({ description: 'Invoice Row ID', example: '65d8b23a9c8d3e001f1a2b3c' })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

}
export class DeleteInvoiceDto {

  @ApiProperty({ description: 'Invoice ID', example: '65d8b23a9c8d3e001f1a2b3c' })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({
    description: 'Flag indicating whether the gift gallery should be deleted. Must be 1.',
    required: true,
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Equals(1, { message: 'is_delete must be 1' })
  is_delete: number;
}


