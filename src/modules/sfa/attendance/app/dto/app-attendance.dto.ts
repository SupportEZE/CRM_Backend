import {
    IsOptional,
    IsString,
    IsArray,
    IsNotEmpty,
    IsMongoId
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppPunchInDto {
    @ApiProperty({ description: 'start lattitude.', required: true })
    @IsString()
    start_lat: string;

    @ApiProperty({ description: 'start longitude.', required: true })
    @IsString()
    start_lng: string;

    @ApiProperty({ description: 'All Variable parameters from form data.', required: true })
    @IsOptional()
    form_data?: Record<string, any>;
}

export class PunchOutDto {
    @ApiProperty({ description: 'Row Id of Attendance.', required: true })
    @IsString()
    _id: string;

    @ApiProperty({ description: 'stop lattitude.', required: true })
    @IsString()
    stop_lat: string;

    @ApiProperty({ description: 'stop longitude.', required: true })
    @IsString()
    stop_lng: string;

    @ApiProperty({ description: 'All Variable parameters from form data.', required: true })
    @IsOptional()
    form_data?: Record<string, any>;
}

export class DetailDto {

    @ApiProperty({ description: '2025-4-10', required: true })
    @IsOptional()
    attend_date: string

}
export class BackgroundDataSaveDto {

    @ApiProperty({ description: 'location info.', required: true })
    @IsNotEmpty()
    @IsArray()
    location: Record<string, any>;

}
export class TimelineDataFetchDto {
    @ApiProperty({ description: 'Date for data want to fetch.', required: true })
    @IsString()
    attend_date: string;

    @ApiProperty({ description: 'user id for data want to fetch.', required: true })
    @IsOptional()
    @IsString()
    user_id: string;
}

export class UploadDto {
    @ApiProperty({ description: 'ID of the data to fetch.', required: true })
    @IsMongoId()
    @IsNotEmpty()
    _id: string;
  
    @ApiProperty({ description: 'Labels associated with the data.', required: false })
    @IsNotEmpty()
    @IsString()
    label: string;
}


