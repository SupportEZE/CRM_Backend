import {
  IsString,
  IsNumber,
  IsOptional,
  Equals,
  Min,
  IsMongoId,
  IsObject,
  IsNotEmpty,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum QuotationType {
  Customer = 'Customer',
  Enquiry = 'Enquiry',
  Site = 'Site',
}
export class OzoneCartItemDto {
  @ApiProperty({ example: '6831c63c3e5c98fa702e526b' })
  @IsMongoId()
  @IsNotEmpty()
  product_id: string;

  @ApiProperty({ example: 'Ball Cock 123 - 1234' })
  @IsString()
  @IsNotEmpty()
  product_name: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @IsOptional()
  sap_code?: string;

  @ApiProperty({ example: 'pcs' })
  @IsString()
  @IsOptional()
  uom?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  qty: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 100 })
  @IsOptional()
  @IsNumber()
  total_price?: number;

  @ApiProperty({ example: 5 })
  @IsOptional()
  @IsNumber()
  discount_percent?: number;

  @ApiProperty({ example: 5 })
  @IsOptional()
  @IsNumber()
  discount_amount?: number;

  @ApiProperty({ example: 95 })
  @IsOptional()
  @IsNumber()
  sub_total?: number;

  @ApiProperty({ example: 112.1 })
  @IsOptional()
  @IsNumber()
  net_amount?: number;

  @ApiProperty({ example: 18 })
  @IsOptional()
  @IsNumber()
  gst_percent?: number;

  @ApiProperty({ example: 17.1 })
  @IsOptional()
  @IsNumber()
  gst_amount?: number;
}

export class OzoneCreateQuotationDto {
  @ApiProperty({ example: '686bb60f8e2fa72746df5bc0' })
  @IsMongoId()
  @IsNotEmpty()
  enquiry_id: string;

  @ApiProperty({ example: '2025-07-08T09:40:00.000Z' })
  @IsString()
  @IsNotEmpty()
  followup_date: string;

  @ApiProperty({ example: 'Some remark text' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ example: 'Some remark text' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ type: [OzoneCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OzoneCartItemDto)
  cart_item: OzoneCartItemDto[];

  @ApiProperty({ example: 95 })
  @IsNumber()
  sub_total: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  total_discount: number;

  @ApiProperty({ example: 17.1 })
  @IsNumber()
  gst: number;

  @ApiProperty({ example: 112.1 })
  @IsNumber()
  total_amount: number;

  @ApiProperty({ example: ['file1.png', 'file2.pdf'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[];
}

export class ozoneUpdateQuotationItemDto {
  @ApiProperty({ description: 'Quotation ID to update', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ example: '686bb60f8e2fa72746df5bc0' })
  @IsMongoId()
  @IsNotEmpty()
  enquiry_id: string;

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
    description: 'Cart items as array of OzoneCartItemDto',
    type: [OzoneCartItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OzoneCartItemDto)
  cart_item?: OzoneCartItemDto[];
}

export class ozoneUpdateQuotationDto {
  @ApiProperty({ description: 'Quotation ID to update', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Follow-up date', required: true })
  @IsString()
  @IsOptional()
  followup_date?: string;
}
export class ozoneReadQuotationDto {
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

export class ozoneDeleteQuotationDto {
  @ApiProperty({
    description: 'Quotation ID',
    example: '65d8b23a9c8d3e001f1a2b3c',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({
    description:
      'Flag indicating whether the gift gallery should be deleted. Must be 1.',
    required: true,
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Equals(1, { message: 'is_delete must be 1' })
  is_delete: number;
}

export class ozoneQuotationDetailDto {
  @ApiProperty({
    description: 'Quotation Row ID',
    example: '65d8b23a9c8d3e001f1a2b3c',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}
export class ozoneQuotationUpdateStatusDto {
  @ApiProperty({ description: 'Quotation ID to update', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({
    description: 'Reject Reason',
    example: 'Win',
    required: false,
  })
  @IsOptional()
  @IsString()
  reject_reason?: string;

  @ApiProperty({ description: 'Stage', example: 'Win', required: false })
  @IsNotEmpty()
  @IsString()
  status?: string;
}

export class ozoneQuotationByEnquiryDto {
  @IsNotEmpty({ message: 'enquiry_id is required' })
  @IsString({ message: 'enquiry_id must be a string' })
  enquiry_id: string;
}
