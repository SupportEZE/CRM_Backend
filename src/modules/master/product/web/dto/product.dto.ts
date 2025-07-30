import {
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
  IsObject,
  IsNotEmpty,
  IsBoolean,
  IsEnum,
  IsArray,
  Equals,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumericObject } from 'src/decorators/numeric-object.dto';
import { Type } from 'class-transformer';

export enum Status {
  Active = 'Active',
  Inactive = 'Inactive',
}

export class CreateProductDto {
  @ApiProperty({ description: 'Category name of the product.', example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  category_name: string;

  @ApiProperty({ description: 'Category name of the product.', example: 'Electronics' })
  @IsString()
  @IsOptional()
  sub_category: string;

  @ApiProperty({ description: 'Name of the product.', maxLength: 200, example: 'Smartphone XYZ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  product_name: string;

  @ApiProperty({ description: 'Unique product code.', maxLength: 200, example: 'PROD-12345' })
  @IsString()
  @MaxLength(200)
  @IsNotEmpty()
  product_code: string;

  @ApiPropertyOptional({
    description: 'Additional product-related data.',
    type: Object,
    example: { color: 'Black', size: 'Medium' },
  })
  @IsObject()
  @IsOptional()
  form_data?: Record<string, any>;

  @ApiProperty({
    description: 'Status of the product.',
    enum: Status,
    example: 'Active',
    default: 'Active',
  })
  @IsNotEmpty()
  @IsEnum(Status)
  status?: Status = Status.Active;

  @ApiPropertyOptional({ description: 'box size.', example: 6 })
  @IsOptional()
  @IsNumber()
  box_size?: number;

  @ApiPropertyOptional({ description: 'Unit of Measurement (UOM).', example: 'Kg' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  uom?: string;

  @ApiPropertyOptional({ description: 'Unit of Measurement (UOM).', example: 'Kg' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gst?: number;

  @ApiPropertyOptional({ description: 'Gst Percent', example: '18' })
  @IsOptional()
  @IsNumber()
  gst_percent?: number;
}


export class ReadProductDto {
  @ApiPropertyOptional({
    description: 'Filter criteria for reading products.',
    type: Object,
    example: { field_name: 'value' },
  })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiPropertyOptional({
    description: 'Sorting criteria for reading products.',
    type: Object,
    example: { product_name: 1 },
  })
  @IsOptional()
  @IsObject()
  sorting?: object;

  @ApiPropertyOptional({
    description: 'Page number for pagination.',
    type: Number,
    example: 1,
  })
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Limit for the number of products per page.',
    type: Number,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit?: number;
}

export class ProductDetailDto {
  @ApiProperty({ description: 'Unique ID of the product.', example: '61324abcdef1234567890abc' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
}

export class UpdateProductDto {
  @ApiProperty({ description: 'Unique ID of the product to update.', example: '61324abcdef1234567890abc' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Updated category name.', maxLength: 200, example: 'Home Appliances' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  category_name?: string;

  @ApiProperty({ description: 'Updated product name.', maxLength: 200, example: 'Smart Washing Machine' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  product_name?: string;

  @ApiProperty({ description: 'Updated product code.', maxLength: 200, example: 'PROD-67890' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  product_code?: string;

  @ApiPropertyOptional({ description: 'box size.', example: 6 })
  @IsOptional()
  @IsNumber()
  box_size?: number;

  @ApiPropertyOptional({ description: 'Gst Percent', example: 6 })
  @IsOptional()
  @IsNumber()
  gst_percent?: number;

  @ApiPropertyOptional({
    description: 'Updated product data.',
    type: Object,
    example: { warranty: '2 years' },
  })
  @IsOptional()
  @IsObject()
  form_data?: Record<string, any>;
}

export class DeleteProductDto {
  @ApiProperty({ description: 'Unique ID of the product to delete.', example: '61324abcdef1234567890abc' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({
    description: 'Flag indicating deletion. Must be 1.',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Equals(1, { message: 'is_delete must be 1' })
  is_delete: number;
}

export class DeleteProductImageDto {
  @ApiProperty({ description: 'Unique ID of the product.', example: '61324abcdef1234567890abc' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
}

export class ProductStatusDto {
  @ApiPropertyOptional({
    description: 'Array of Product IDs (as strings).',
    example: [
      "67c9904bd2ede5ebd2647e24",
      "67c9906ad2ede5ebd2647e25"
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  _id?: string[];

  @ApiProperty({
    description: 'Updated status of the product.',
    enum: Status,
    example: 'Inactive',
  })
  @IsNotEmpty()
  @IsEnum(Status)
  status: Status;
}

export class DuplicacyCheckDto {
  @ApiPropertyOptional({ description: 'Product name for duplication check.', maxLength: 200, example: 'Smartphone XYZ' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product code for duplication check.', maxLength: 200, example: 'PROD-12345' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  product_code?: string;
}

export class ReadDropdownDto {

  @ApiProperty({ description: 'Customer Type Id', example: '61324abcdef1234567890abc' })
  @IsMongoId()
  @IsOptional()
  customer_type_id: string;

  @ApiPropertyOptional({
    description: 'Filters for dropdowns.',
    type: Object,
    example: { field_name: 'value' },
  })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiPropertyOptional({
    description: 'Sorting criteria for dropdowns.',
    type: Object,
    example: { dropdown_name: 1 },
  })
  @IsOptional()
  @IsObject()
  sorting?: object;

  @ApiPropertyOptional({
    description: 'Sorting criteria for dropdowns.',
    type: Object,
    example: { dropdown_name: 1 },
  })
  @IsOptional()
  @IsString()
  dropdown_name?: string;

  @ApiPropertyOptional({
    description: 'Limit for the number of dropdowns per page.',
    type: Number,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination.',
    type: Number,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  page?: number;
}

export class DownloadProductDto {
  @ApiProperty({
    description: 'Headers to include in the downloaded data.',
    type: [String],
    example: ['Product Name', 'Category Name'],
  })
  @IsNotEmpty()
  @IsArray()
  headers: string[];

  @ApiPropertyOptional({
    description: 'Sorting criteria for downloading data.',
    type: Object,
    example: { product_name: 1 },
  })
  @IsOptional()
  sorting?: Record<string, 1 | -1>;

  @ApiPropertyOptional({
    description: 'Search term for filtering downloaded data.',
    example: 'Smartphone',
  })
  @IsOptional()
  search?: string;
}

export class ProductImportDto {
  @ApiProperty({ description: 'Form ID related to the import.', example: 123 })
  @IsNotEmpty()
  @IsNumber()
  form_id: number;

  @ApiProperty({
    description: 'CSV data to import.',
    type: Array,
    example: [{ product_name: 'Smartphone', product_code: 'PROD-12345' }],
  })
  @IsNotEmpty()
  @IsArray()
  csv_data?: Record<string, any>[];
}

export class ProductDocsDto {
  @ApiProperty({ example: '609e126f61e3e53b7c2d672c', description: 'Document ID or associated record ID' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
}

export class CreateProductPriceDto {
  @IsMongoId()
  @IsNotEmpty()
  product_id: string;

  @IsNotEmpty()
  form_data: Record<string, any> | any[];
}

export class ProductSaveDiscountDto {

  @ApiPropertyOptional({ type: String, description: 'Type of discount' })
  @IsOptional()
  @IsString()
  discount_type?: string;

  @ApiPropertyOptional({ type: String, description: 'Name of Product/Category' })
  @IsNotEmpty()
  @IsString()
  discount_name?: string;

  @ApiProperty({ type: String, description: 'Discount ID (Mongo ObjectId)' })
  @IsMongoId()
  discount_id: string;

  @ApiPropertyOptional({ type: String, description: 'Customer type name' })
  @IsNotEmpty()
  @IsString()
  customer_type_name?: string;

  @ApiPropertyOptional({ type: String, description: 'Customer type ID' })
  @IsNotEmpty()
  @IsMongoId()
  customer_type_id?: string;

  @ApiProperty({ type: Object, description: 'Form data in key-value format' })
  @IsNumericObject()
  @IsNotEmpty()
  form_data: Record<string, any>;
}

export class ProductReadDiscountDto {

  @ApiPropertyOptional({ type: String, description: 'Customer type ID' })
  @IsNotEmpty()
  @IsMongoId()
  customer_type_id?: string;

  @ApiPropertyOptional({
    description: 'Filter criteria for reading products.',
    type: Object,
    example: { field_name: 'value' },
  })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiPropertyOptional({
    description: 'Sorting criteria for reading products.',
    type: Object,
    example: { product_name: 1 },
  })
  @IsOptional()
  @IsObject()
  sorting?: object;

  @ApiPropertyOptional({
    description: 'Page number for pagination.',
    type: Number,
    example: 1,
  })
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Limit for the number of products per page.',
    type: Number,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit?: number;

}

export class OrderPriceConfigDto {

  @ApiPropertyOptional({ type: String, description: 'Product ID' })
  @IsNotEmpty()
  @IsMongoId()
  product_id?: string;

  @ApiPropertyOptional({ type: String, description: 'Customer Type ID' })
  @IsOptional()
  @IsMongoId()
  customer_id?: string;

  @ApiPropertyOptional({ type: String, description: 'Customer Type ID' })
  @IsOptional()
  @IsMongoId()
  customer_type_id?: string;

}

export class CreateProductDispatchDto {
  @IsMongoId()
  @IsNotEmpty()
  product_id: string;

  @IsNumber()
  @IsOptional()
  box_size: number;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  master_box_size: number;

  @IsBoolean()
  @IsNotEmpty()
  box_with_item: boolean;

  @IsBoolean()
  @IsNotEmpty()
  qr_genration: boolean;

  @IsString()
  @IsOptional()
  uom: string;
}

export class FetchProductDispatchDto {
  @IsMongoId()
  @IsNotEmpty()
  product_id: string;
}

