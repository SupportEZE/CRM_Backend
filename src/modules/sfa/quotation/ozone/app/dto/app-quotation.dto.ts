import {
  IsString, IsNumber, IsOptional, Min, IsObject, IsMongoId, IsNotEmpty, IsEnum, ValidateIf, IsArray, ValidateNested, Equals
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuotationType } from '../../web/dto/ozone-quotation.dto';
import { Type } from 'class-transformer';

export enum QuotatioStage {
  Lost = 'Lost',
  Win = 'Lost',
  Negotiate = 'Negotiate'
}
export class appOzoneCartItemDto {
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

export class appOzoneCreateQuotationDto {
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

  @ApiProperty({ type: [appOzoneCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => appOzoneCartItemDto)
  cart_item: appOzoneCartItemDto[];

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

  @ApiProperty({ example: 'app' })
  @IsString()
  platform: string;

  @ApiProperty({ example: 'com.crm_coresync_dev' })
  @IsString()
  app_id: string;

  @ApiProperty({ example: ['file1.png', 'file2.pdf'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[];
}
export class AppOzoneReadQuotationDto {
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
export class appQuotationUpdateStageDto {
  @ApiProperty({ description: 'Quotation ID to update', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Stage', example: 'Win', required: false })
  @IsNotEmpty()
  @IsString()
  stage: string;

  @ApiProperty({ description: 'Stage', example: 'Win', required: false })
  @ValidateIf(o => o.stage === QuotatioStage.Lost)
  @IsNotEmpty()
  @IsString()
  reson: string;
}


