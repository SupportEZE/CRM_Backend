import {
  IsString, IsNumber, IsOptional, Equals, ValidateIf, IsEnum, Min, IsMongoId, IsObject, IsNotEmpty, ValidateNested, IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum QuotationType {
  Customer = 'Customer',
  Enquiry = 'Enquiry',
  Site = 'Site',
}

export class CartItemDto {
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

  @ApiProperty({ description: 'Gst In Percentage', example: 500, required: false })
  @IsNotEmpty()
  @IsNumber()
  gst_percent?: number;

  @ApiProperty({ description: 'Gst in AMount', example: 500, required: false })
  @IsNotEmpty()
  @IsNumber()
  gst_amount?: number;

  @ApiProperty({ description: 'Sub  Total of Item', example: 500, required: false })
  @IsNotEmpty()
  @IsNumber()
  sub_total?: number;

  @ApiProperty({ description: 'Net Amount', example: 500, required: false })
  @IsNotEmpty()
  @IsNumber()
  net_amount?: number;
}

export class CreateQuotationDto {

  @ApiProperty({ description: 'Quotation title', example: 'New Quotation Add', required: true })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Quotation type', example: 'Site', enum: QuotationType })
  @IsEnum(QuotationType)
  @IsNotEmpty()
  quotation_type: QuotationType;

  @ApiProperty({ description: 'Quotation Id', example: 'Quo-0000001', required: true })
  @IsString()
  @IsOptional()
  quotation_id: string;

  @ApiProperty({ description: 'Module ID', example: '4', required: false })
  @IsNumber()
  @IsNotEmpty()
  module_id: string;

  @ApiProperty({ description: 'Module Name', example: 'Customers', required: false })
  @IsString()
  @IsNotEmpty()
  module_name: string;

  @ApiProperty({ description: 'Customer Category', example: 'Distributor Dealer', required: false })
  @ValidateIf((o) => o.quotation_type === QuotationType.Customer)
  @IsString()
  @IsNotEmpty()
  customer_type_name: string;

  @ApiProperty({ description: 'Customer Category Type ID', example: '67f40ee577c6fb24c6d1b367', required: false })
  @ValidateIf((o) => o.quotation_type === QuotationType.Customer)
  @IsMongoId()
  @IsNotEmpty()
  customer_type_id: string;

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
    type: [CartItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  cart_item?: CartItemDto[];

}

export class UpdateQuotationItemDto {
  @ApiProperty({ description: 'Quotation ID to update', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

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

  @ApiProperty({
    description: 'Cart items as array of CartItemDto',
    type: [CartItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  cart_item?: CartItemDto[];
}

export class UpdateQuotationDto {
  @ApiProperty({ description: 'Quotation ID to update', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Follow-up date', required: true })
  @IsString()
  @IsNotEmpty()
  followup_date: string;
}
export class ReadQuotationDto {
  @ApiProperty({ description: 'Filters', required: false })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiProperty({ description: 'Active tab', required: false })
  @IsOptional()
  @IsString()
  activeTab?: string;

  @ApiProperty({ description: 'Sorting', required: false })
  @IsOptional()
  @IsObject()
  sorting?: object;

  @ApiProperty({ description: 'Page number', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class DeleteQuotationDto {

  @ApiProperty({ description: 'Quotation ID', example: '65d8b23a9c8d3e001f1a2b3c' })
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


export class QuotationDetailDto {

  @ApiProperty({ description: 'Quotation Row ID', example: '65d8b23a9c8d3e001f1a2b3c' })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

}
export class QuotationUpdateStatusDto {
  @ApiProperty({ description: 'Quotation ID to update', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Reject Reason', example: 'Win', required: false })
  @IsOptional()
  @IsString()
  reject_reason?: string;

  @ApiProperty({ description: 'Stage', example: 'Win', required: false })
  @IsNotEmpty()
  @IsString()
  status?: string;
}