import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsObject,
  IsNotEmpty,
  IsMongoId,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignCustomersForHome {
  @ApiPropertyOptional({ example: 'mongo id' })
  @IsNotEmpty()
  @IsMongoId()
  customer_type_id: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @IsOptional()
  login_type_id: string;

  @ApiPropertyOptional({ example: 'Active' })
  @ValidateIf((o) => o.login_type_id !== 5 && o.login_type_id !== 6)
  @IsNotEmpty({ message: 'profile_status is required' })
  @IsString()
  profile_status: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit: number;

  @ApiPropertyOptional({ type: Object, example: { customer_name: "John Doe" } })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiPropertyOptional({ example: 'Enquiry Site' })
  @IsOptional()
  @IsString()
  tab: string;
}

