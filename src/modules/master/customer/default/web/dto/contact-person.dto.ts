
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsDate, IsNumber, MaxLength, IsArray, IsObject, Min, IsEnum, IsPhoneNumber, IsMongoId, Equals } from 'class-validator';

export class CreateContactPersonDto {
  @ApiProperty({ example: '609e126f61e3e53b7c2d672c', description: 'Customer ID to which this contact person belongs' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  customer_id: string;

  @ApiPropertyOptional({ example: 'Manager', description: 'Designation or title of the contact person' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Name of the contact person' })
  @IsNotEmpty()
  @IsString()
  contact_person_name: string;

  @ApiProperty({ example: '9876543210', description: 'Mobile number of the contact person' })
  @IsNotEmpty()
  @IsString()
  contact_person_mobile: string;
}

export class UpdateContactPersonDto {
  @ApiProperty({ example: '609e126f61e3e53b7c2d672c', description: 'Unique ID of the contact person record' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiPropertyOptional({ example: 'Team Lead', description: 'Designation or job title of the contact person' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiProperty({ example: 'John Smith', description: 'Updated name of the contact person' })
  @IsNotEmpty()
  @IsString()
  contact_person_name: string;

  @ApiProperty({ example: '9123456789', description: 'Updated mobile number of the contact person' })
  @IsNotEmpty()
  @IsString()
  contact_person_mobile: string;
}

export class DeleteContactPersonInfo {
  @ApiProperty({ example: '609e126f61e3e53b7c2d672c', description: 'Contact person ID to be deleted' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({ example: 1, description: 'Must be 1 to confirm soft delete' })
  @IsNotEmpty()
  @IsNumber()
  @Equals(1)
  is_delete: number;
}

