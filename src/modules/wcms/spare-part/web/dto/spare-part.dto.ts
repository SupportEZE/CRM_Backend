import {
    IsArray, IsDate, IsEnum, IsMongoId, IsNotEmpty, IsNumber,
    IsObject, IsOptional, IsString, Min, ValidateNested, IsIn, ValidateIf
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateSparePartDto {

    @ApiProperty({ description: 'Product Name', example: 'Banner' })
    @IsNotEmpty()
    @IsString()
    product_name: string;

    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsNotEmpty()
    @IsNumber()
    mrp: number;


}

export class ReadSparePartDto {

    @ApiPropertyOptional({ type: Object, description: 'Filter options for reading stock audit data' })
    @IsOptional()
    @IsObject()
    filters: object;

    @ApiPropertyOptional({ type: Object, description: 'Sorting options' })
    @IsOptional()
    @IsObject()
    sorting: object;

    @ApiProperty({ example: 'Company', description: 'Tab filter: Company/Team', required: false })
    @IsOptional()
    @IsString()
    activeTab?: string;

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

export class DetailSparePartDto {

    @ApiProperty({ example: "60d21b4667d0d8992e610c85", description: "PopGift ID", required: true })
    @IsOptional()
    @IsMongoId()
    _id: string;

    @ApiProperty({ example: "60d21b4667d0d8992e610c85", description: "PopGift ID", required: true })
    @IsOptional()
    @IsMongoId()
    assigned_to_id: string;

    @ApiProperty({ example: 'Reject', description: 'Tab filter: Reject / Verified', required: false })
    @IsOptional()
    @IsString()
    activeTab?: string;
}

export class CreateManageStockDto {

    @ApiProperty({ description: 'Product Name', example: 'Banner' })
    @IsNotEmpty()
    @IsString()
    product_name: string;

    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsNotEmpty()
    @IsString()
    delivery_note: string;

    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsOptional()
    @IsNumber()
    assigned_to_login_id: number;

    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsOptional()
    @IsMongoId()
    assigned_to_id: string;

    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsNotEmpty()
    @IsString()
    transaction_type: string;

    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsOptional()
    @IsString()
    assign_to_type: string;


    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsNotEmpty()
    @IsString()
    assigned_to_name: string;

    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsOptional()
    @IsNumber()
    assigned_from_login_id: number;

    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsOptional()
    @IsMongoId()
    assigned_from_id: string;

    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsOptional()
    @IsString()
    assign_from_type: string;


    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsOptional()
    @IsString()
    assigned_from_name: string;


    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsNotEmpty()
    @IsMongoId()
    product_id: string;

    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsNotEmpty()
    @IsNumber()
    transaction_qty: number;



}


export class ReadManageStockDto {

    @ApiPropertyOptional({ type: Object, description: 'Filter options for reading stock audit data' })
    @IsOptional()
    @IsObject()
    filters: object;

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

export class UpdateSparePartDto {
    @ApiProperty({ description: 'The ID of the bonus', example: 'abc123' })
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    _id: string;

    @ApiProperty({ description: 'Product Name', example: 'Banner' })
    @IsNotEmpty()
    @IsString()
    product_name: string;

    @ApiProperty({ description: 'Description of the Product', example: 'Business trip to NYC' })
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiProperty({ description: 'MRP of the Product', example: 'Mrp trip to NYC' })
    @IsNotEmpty()
    @IsNumber()
    mrp: number;

}

export class DeleteSparePartDto {
    @ApiProperty({
        description: 'The unique identifier of the pop gift to be deleted',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;
}

export class ReadDropdownDto {
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

  @IsOptional()
  @IsString()
  _id?: string;


  @ApiPropertyOptional({
    description: 'Limit for the number of dropdowns per page.',
    type: Number,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit?: number;
}


