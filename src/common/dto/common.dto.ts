import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, Equals, IsArray, IsMongoId, IsNotEmpty, IsNumber } from "class-validator";

export class _IdDto {
    @ApiProperty({
        description: 'Unique identifier',
        example: '609e126f61e3e53b7c2d672c',
    })
    @IsMongoId()
    @IsNotEmpty()
    _id: string;
}

export class _IdsDto {
    @ApiProperty({
        description: 'Unique identifier',
        example: '609e126f61e3e53b7c2d672c',
    })
    @IsArray()
    @IsNotEmpty()
    _ids: string;
}
export class CustomerIdDto {
    @ApiProperty({
        description: 'Unique identifier',
        example: '609e126f61e3e53b7c2d672c',
    })
    @IsMongoId()
    @IsNotEmpty()
    customer_id: string;
}

export class ProductIdDto {
    @ApiProperty({
        description: 'Unique identifier',
        example: '609e126f61e3e53b7c2d672c',
    })
    @IsMongoId()
    @IsNotEmpty()
    product_id: string;
}

export class DeleteDto {

    @ApiProperty({
        description: 'Unique identifier',
        example: '609e126f61e3e53b7c2d672c',
    })
    @IsMongoId()
    @IsNotEmpty()
    _id: string;

    @ApiProperty({ description: 'Flag indicating whether the target should be deleted. Must be 1.', required: true, example: 1, })
    @IsNotEmpty()
    @IsNumber()
    @Equals(1, { message: 'is_delete must be 1' })
    is_delete: number;
}

export class DeleteMultipleFilesDto {
    @IsArray()
    @ArrayNotEmpty()
    ids: string[];
}
