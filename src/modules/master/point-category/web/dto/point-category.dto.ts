import { Transform, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsEmail, ValidateIf, IsIn, IsDate, IsNumber, MaxLength, IsObject, Min, IsEnum, IsPhoneNumber, IsArray, ValidateNested, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatusEnum {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}
export class PointDataDTO {
    @ApiProperty({
        description: 'Customer Type ID associated with the point category.',
        example: '60ad0f486123456789abcdef',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    customer_type_id: string;

    @ApiProperty({
        description: 'Customer Type Name.',
        example: 'abc',
    })
    @IsNotEmpty()
    @IsString()
    customer_type_name: string;

    @ApiProperty({
        description: 'Point value for the specified customer type.',
        example: 50,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    point_value: number;
}
export class CreatePointCategoryDto {
    @ApiProperty({
        description: 'Name of the Point Category.',
        example: 'Loyalty Points',
    })
    @IsNotEmpty()
    @IsString()
    point_category_name: string;

    @ApiProperty({
        description: 'Array of points data associated with the category.',
        type: [PointDataDTO],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PointDataDTO)
    point: PointDataDTO[];
}

export class UpdatePointCategoryDto {
    @ApiProperty({
        description: 'Unique identifier for the Point Category.',
        example: '60ad0f486123456789abcdef',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;

    @ApiProperty({
        description: 'Updated name of the Point Category.',
        example: 'Updated Loyalty Points',
    })
    @IsNotEmpty()
    @IsString()
    point_category_name?: string;

    @ApiPropertyOptional({
        description: 'Updated array of points data associated with the category.',
        type: [PointDataDTO],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PointDataDTO)
    point?: PointDataDTO[];
}
export class ReadPointCategoryDto {
    @ApiPropertyOptional({
        description: 'Filters for reading point categories.',
        example: { field_name: 'value' },
    })
    @IsOptional()
    @IsObject()
    filters?: object;
}
export class DetailPointCategoryDto {
    @ApiProperty({
        description: 'Unique identifier for the Point Category to retrieve details.',
        example: '60ad0f486123456789abcdef',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;
}

export class ProductMapDto {
    @ApiProperty({
        description: 'MongoDB Object ID of the product.',
        example: '60ad0f486123456789abcdef',
    })
    @ValidateIf((o) => !o.is_delete)
    @IsNotEmpty()
    @IsMongoId()
    product_id: string;

    @ApiProperty({
        description: 'MongoDB Object ID of the point category.',
        example: '60ad0f486123456789abcdef',
    })
    @ValidateIf((o) => !o.is_delete)
    @IsNotEmpty()
    @IsMongoId()
    point_category_id: string;

    @ApiProperty({
        description: 'Point Category Name.',
        example: 'ABC',
    })
    @ValidateIf((o) => !o.is_delete)
    @IsNotEmpty()
    @IsString()
    point_category_name: string;

    @ApiProperty({
        description: 'Flag to mark as deleted.',
        example: 1,
    })
    @IsOptional()
    is_delete?: number;
}