import { IsString, IsNotEmpty, IsNumber, IsMongoId, Equals, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class SaveShippingAddressDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Unique customer ID (MongoDB ObjectId) to whom the shipping address belongs',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  customer_id: string;

  @ApiProperty({
    example: 'Karnataka',
    description: 'State of the shipping address',
  })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({
    example: 'Karnataka',
    description: 'State of the shipping address',
  })
  @IsNotEmpty()
  @IsString()
  shipping_state: string;

  @ApiProperty({
    example: 'Bangalore',
    description: 'District of the shipping address',
  })
  @IsNotEmpty()
  @IsString()
  shipping_district: string;

  @ApiProperty({
    example: 'Bangalore',
    description: 'City of the shipping address',
  })
  @IsNotEmpty()
  @IsString()
  shipping_city: string;

  @ApiProperty({
    example: 560001,
    description: 'Pincode of the shipping location',
  })
  @IsNotEmpty()
  @IsNumber()
  shipping_pincode: number;

  @ApiProperty({
    example: '123 Main Street, Bangalore',
    description: 'Detailed address for shipping',
  })
  @IsNotEmpty()
  @IsString()
  shipping_address: string;


  @ApiProperty({
    example: 560001,
    description: 'shipping_contact_number of the shipping location',
  })
  @IsOptional()
  @IsString()
  shipping_contact_number: string;

  @ApiProperty({
    example: 560001,
    description: 'shipping_contact_name of the shipping location',
  })
  @IsOptional()
  @IsString()
  shipping_contact_name: string;
}

export class UpdateShippingAddressDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Unique ID of the shipping address record (MongoDB ObjectId)',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer ID linked to the shipping address',
  })
  @IsNotEmpty()
  @IsMongoId()
  customer_id: string;

  @ApiProperty({
    example: 'Karnataka',
    description: 'Updated state of the shipping address',
  })
  @IsNotEmpty()
  @IsString()
  shipping_state: string;

  @ApiProperty({
    example: 'Bangalore',
    description: 'Updated district of the shipping address',
  })
  @IsNotEmpty()
  @IsString()
  shipping_district: string;

  @ApiProperty({
    example: 'Bangalore',
    description: 'Updated city of the shipping address',
  })
  @IsNotEmpty()
  @IsString()
  shipping_city: string;

  @ApiProperty({
    example: 560001,
    description: 'Updated pincode of the shipping location',
  })
  @IsNotEmpty()
  @IsNumber()
  shipping_pincode: number;

  @ApiProperty({
    example: '123 Main Street, Bangalore',
    description: 'Updated detailed address for shipping',
  })
  @IsNotEmpty()
  @IsString()
  shipping_address: string;
}

export class DeleteShippingAddress {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Shipping address ID to be deleted (MongoDB ObjectId)',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({
    example: 1,
    description: 'Must be set to 1 to confirm deletion (soft delete)',
  })
  @IsNotEmpty()
  @IsNumber()
  @Equals(1)
  is_delete: number;
}

