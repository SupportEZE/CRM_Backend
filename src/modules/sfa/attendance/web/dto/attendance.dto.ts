import { IsNumber, IsOptional, Min, ValidateNested, IsString, IsNotEmpty, ValidateIf, IsMongoId, IsDate, IsISO8601 } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';


export class UpdateAttendanceDto {
    @ApiProperty({
        description: 'user id'
    })
    @IsOptional()
    user_id: string;

    @ApiProperty({
        description: 'attendance id'
    })
    @IsOptional()
    _id: string;

    @ApiProperty({
        description: 'Punch out'
    })
    @IsOptional()
    punch_out: string;

    @ApiProperty({
        description: 'Punch in'
    })
    @IsOptional()
    punch_in: string;
}

export class ReadAttendanceDto {
    @ApiProperty({
        description: 'Filters to apply for attendance search. Must be a valid object.',
        required: false,
    })
    @IsOptional()
    filters: Record<string, any>;

    @ApiProperty({
        description: 'Page number for pagination. Minimum value is 1.',
        example: 1,
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(1)
    page: number;

    @ApiProperty({
        description: 'Number of records per page. Minimum value is 10.',
        example: 10,
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(10)
    limit: number;
}


export class DetailAttendanceDto {
    @ApiProperty({ description: 'attendance_id is optional when user_id and attend_date are provided.', required: false })
    @IsMongoId()
    @IsOptional()
    attendance_id?: string;

    @ApiProperty({ description: 'User ID', required: false })
    @ValidateIf((o) => !o.attendance_id)
    @IsString()
    @IsNotEmpty()
    user_id?: string;

    @ApiProperty({ description: 'Attendance Date', required: false })
    @ValidateIf((o) => !o.attendance_id)
    @IsString()
    @IsNotEmpty()
    attend_date?: string;
}

export class ResetDto {
    @ApiProperty({ description: 'attendance_id' })
    @IsMongoId()
    @IsNotEmpty()
    attendance_id: string;
}
export class PunchInDto {
    @ApiProperty({ description: 'user_id' })
    @IsMongoId()
    @IsNotEmpty()
    user_id: string;

    @ApiProperty({ description: 'punch_in' })
    @IsISO8601()
    @IsNotEmpty()
    attend_date: string;

    @ApiProperty({ description: 'punch_in' })
    @IsISO8601()
    @IsNotEmpty()
    punch_in: string;

    @ApiProperty({ description: 'punch_out' })
    @IsISO8601()
    @IsOptional()
    punch_out: string;

    @ApiProperty({ description: "Timezone selection key"})
    @IsOptional()
    timezone: string
}

export class AbsentDto {
    @ApiProperty({ description: 'attendance_id' })
    @IsMongoId()
    @IsNotEmpty()
    attendance_id: string;
}

export class AttendanceDocsDto {
    @ApiProperty({ description: 'doc_id' })
    @IsMongoId()
    @IsNotEmpty()
    _id: string;

}

export class commonDto {
    @IsMongoId()
    @IsNotEmpty()
    user_id: string;

    @IsISO8601()
    @IsNotEmpty()
    attend_date: string;

    @ApiProperty({ description: 'attendance_id' })
    @IsMongoId()
    @IsOptional()
    attendance_id: string;
}


export class SingleMonthReadDto {
    @IsMongoId()
    @IsNotEmpty()
    user_id: string;

    @IsISO8601()
    @IsNotEmpty()
    attend_date: string;

    @ApiProperty({ description: 'attendance_id' })
    @IsMongoId()
    @IsNotEmpty()
    attendance_id: string;


}

export class MapViewDto {
    @IsISO8601()
    @IsNotEmpty()
    attend_date: string;

}


