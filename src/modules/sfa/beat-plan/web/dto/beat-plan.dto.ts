import { IsString, IsNumber, IsOptional, MaxLength, Min, IsObject, IsNotEmpty, Equals, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateBeatPlanDto {

  @ApiProperty({ description: 'user_id is a required field', required: false, example: '682871db7016851b44344d57' })
  @IsNotEmpty()
  @IsMongoId()
  user_id: string;

  @ApiProperty({ description: 'user_name is a required field', required: false, example: 'Shyam' })
  @IsString()
  @IsNotEmpty()
  user_name: string;

  @ApiProperty({ description: 'user_mobile is a required field', required: false, example: '9897979797' })
  @IsString()
  @IsNotEmpty()
  user_mobile: string;

  @ApiProperty({ description: 'beat_code is a required field', required: false, example: 'BEAT-99877' })
  @IsString()
  @IsNotEmpty()
  beat_code: string;

  @ApiProperty({ description: 'date is a optional field', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  date?: string;

  @ApiProperty({ description: 'description is a required field', required: false, example: 'Sec-109/Sec-110/Sec-111/Sec-114' })
  @IsString()
  @IsNotEmpty()
  description: string;

}

export class ReadBeatPlanDto {

  @ApiProperty({ description: 'filters is an optional field', required: false })
  @IsOptional()
  @IsObject()
  filters: object;

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


export class UnAssignBeatPlanDto {

  @ApiProperty({ description: 'id is a required', required: true })
  @IsNotEmpty()
  @IsMongoId()
  user_id: string;

  @ApiProperty({ description: 'beat_code is a required', required: true })
  @IsNotEmpty()
  @IsString()
  beat_code: string;

  @ApiProperty({ description: 'date is a required', required: true })
  @IsNotEmpty()
  @IsString()
  date: string;

  @IsNotEmpty()
  @IsNumber()
  @Equals(1, { message: 'is_delete must be 1' })
  is_delete: number;
}

export class DeleteBeatPlanDto {

  @ApiProperty({ description: 'id is a required', required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({ description: 'id is a required', required: true })
  @IsNotEmpty()
  @IsNumber()
  is_delete: number;

}

export class ReadBeatAssigningWise {
  @ApiProperty({ description: 'user_id is a required', required: true })
  @IsNotEmpty()
  @IsString()
  user_id: string;
}


export class ReadBeatParty {
  @ApiProperty({ description: 'beat_code is a required', required: true })
  @IsNotEmpty()
  @IsString()
  beat_code: string;

  @ApiProperty({ description: 'user_id is a required', required: true })
  @IsNotEmpty()
  @IsString()
  user_id: string;
}

export class UpdateBeatDto {

  @ApiProperty({ description: 'target value', required: true })
  @IsNotEmpty()
  @IsNumber()
  target_value: number;
}

