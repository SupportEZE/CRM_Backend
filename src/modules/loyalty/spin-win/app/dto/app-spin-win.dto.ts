import { IsString, IsNumber, IsMongoId, IsOptional, MaxLength, Min, ArrayNotEmpty, Max, IsDate, Equals, IsObject, IsNotEmpty, IsEnum, ValidateNested, ValidateIf, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpinWinCustomerDto {
    @ApiProperty({
        description: 'Spin points earned or assigned to the customer for this spin win.',
        example: 15,
        minimum: 1,
        required: true,
    })
    @IsNotEmpty()
    @IsNumber({}, { message: 'spin_point must be a number' })
    @Min(1, { message: 'spin_point must be at least 1' })
    spin_point: number;

    @ApiProperty({ example: '609e126f61e3e53b7c2d672c', description: 'Unique spin identifier (MongoDB ObjectId)' })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    spin_id: string;
}
