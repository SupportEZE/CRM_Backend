import { IsString, IsNumber, IsOptional, MaxLength, Min, IsObject, isNotEmpty, IsNotEmpty, IsEnum, IsArray, ValidateIf, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document,Types } from 'mongoose';


// Define the platform type enum
export enum PlatformType {
  APP = 'app',
  WEB = 'web',
}

export class CreateLiveChatDto {
  @IsString()
  @MaxLength(100)
  livechat_name: string;

  @IsNumber()
  @Min(0) 
  @Transform(({ value }) => parseFloat(value))
  livechat_mobile: number;

  @IsArray()
  @IsOptional()
  form_data?: Record<string, any>;

  @IsNumber()
  @IsOptional() 
  status: number = 1;
}

export class ReadLiveChatDto {
  @IsOptional()
  @IsObject()
  filters: object;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;
}

export class UpdateLiveChatDto {
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  livechat_name: string;

  @IsOptional()
  @IsNumber()
  @Min(0) 
  @Transform(({ value }) => parseFloat(value)) 
  livechat_mobile: number;

  @IsOptional()
  @IsArray()
  @IsOptional()
  form_data?: Record<string, any>;

}
export class GetRoomIdDto {
  @IsNotEmpty()
  @IsMongoId()
  receiver_id: string;
}

export class JoinRoomDto {
  @IsNotEmpty()
  @IsMongoId()
  receiver_id: Types.ObjectId;

  @ApiPropertyOptional({ type: String, description: 'Room ID (MongoDB ObjectId)' })
  @IsNotEmpty()
  @IsMongoId()
  room_id: Types.ObjectId;

}

export class ReadChatMessageDto {

  @ApiPropertyOptional({ type: String, description: 'Room ID (MongoDB ObjectId)' })
  @IsNotEmpty()
  @IsMongoId()
  room_id: Types.ObjectId;
  
}

export class MessageDto {

  @ApiPropertyOptional({ enum: PlatformType, description: 'Platform type (app/web)' })
  @IsOptional()
  @IsEnum(PlatformType)
  platform?: PlatformType;

  @ApiPropertyOptional({ type: String, description: 'Room ID (MongoDB ObjectId)' })
  @IsNotEmpty()
  @IsMongoId()
  room_id: Types.ObjectId;

  @ApiProperty({ type: String, description: 'Sender ID (MongoDB ObjectId)' })
  @IsMongoId()
  @IsNotEmpty()
  sender_id: Types.ObjectId; 
  
  @ApiProperty({ type: String, description: 'Receiver ID (MongoDB ObjectId)' })
  @IsMongoId()
  @IsNotEmpty()
  receiver_id: Types.ObjectId; 

  @ApiProperty({ type: String, description: 'Message content' })
  @IsString()
  message: string;
}

export class AppMessageDto {

  @ApiPropertyOptional({ enum: PlatformType, description: 'Platform type (app/web)' })
  @IsOptional()
  @IsEnum(PlatformType)
  platform?: PlatformType;

  @ApiPropertyOptional({ type: String, description: 'Room ID (MongoDB ObjectId)' })
  @IsNotEmpty()
  @IsMongoId()
  room_id: Types.ObjectId;

  @ApiProperty({ type: String, description: 'Sender ID (MongoDB ObjectId)' })
  @IsMongoId()
  @IsNotEmpty()
  sender_id: Types.ObjectId;  

  @ApiProperty({ type: String, description: 'Message content' })
  @IsString()
  message: string;
}