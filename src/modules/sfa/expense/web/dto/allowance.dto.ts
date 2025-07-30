import { IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReadAllowanceDto {

    @ApiProperty({ description: 'Filter criteria', required: false, example: { status: 'approved' } })
    @IsOptional()
    @IsObject()
    filters?: object;

    @ApiProperty({ description: 'Page number for pagination', required: false, example: 1 })
    @IsOptional()
    @IsNumber()
    page?: number;

    @ApiProperty({ description: 'Limit of records per page', required: false, example: 10 })
    @IsOptional()
    @IsNumber()
    limit?: number;

    @ApiProperty({ description: 'Form ID associated with the allowance', example: 123 })
    @IsNotEmpty()
    @IsNumber()
    form_id?: number;
}

export class SaveAllowanceDto {

    @ApiProperty({ description: 'User ID associated with the allowance', example: '65d8b23a9c8d3e001f1a2b3c' })
    @IsNotEmpty()
    @IsMongoId()
    user_id?: string;

    @ApiProperty({
        description: 'Form data containing allowance details',
        example: { allowance_type: 'travel', amount: 500 },
        type: Object
    })
    @IsNotEmpty()
    @IsObject()
    form_data: Record<string, any>;
}
