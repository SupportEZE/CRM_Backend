import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { Types } from 'mongoose';

export class ChatInitDto {
  
  @ApiProperty({
    description: 'The message content.',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
export class ReadAppChatMessageDto {

  @ApiPropertyOptional({ type: String, description: 'Room ID (MongoDB ObjectId)' })
  @IsOptional()
  @IsMongoId()
  room_id: Types.ObjectId;

  @ApiPropertyOptional({ type: String, description: 'Customer ID (MongoDB ObjectId)' })
  @IsOptional()
  @IsMongoId()
  customer_id: Types.ObjectId;
  
}

