import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, IsObject, IsNotEmpty, ValidateIf, Min, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum QrCodeType {
  ITEM = 'item',
  BOX = 'box',
  POINT_CATEGORY = 'point_category',
}

export enum status {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export class CreateQRCodeDto {
  @ApiProperty({
    description: 'QR code type (item, box, or point_category)',
    enum: QrCodeType,
    example: QrCodeType.ITEM,
  })
  @IsNotEmpty()
  @IsEnum(QrCodeType)
  qrcode_type: QrCodeType;

  @ApiProperty({
    description: 'Product ID (required if qrcode_type is not point_category)',
    example: 'product123',
  })
  @ValidateIf((o) => o.qrcode_type === QrCodeType.ITEM)
  @IsNotEmpty()
  @IsString()
  item?: string;

  @ApiProperty({
    description: 'Product ID (required if qrcode_type is not point_category)',
    example: 'product123',
  })
  @ValidateIf((o) => o.qrcode_type === QrCodeType.BOX)
  @IsNotEmpty()
  @IsString()
  box?: string;

  @ApiProperty({
    description: 'Point category ID (required if qrcode_type is point_category)',
    example: 'pointCat456',
  })
  @ValidateIf((o) => o.qrcode_type === QrCodeType.POINT_CATEGORY)
  @IsNotEmpty()
  @IsString()
  point_category?: string;

  @ApiProperty({
    description: 'Number of QR codes to generate',
    example: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  qrcode_qty: number;

  @ApiProperty({
    description: 'Paper size for printing',
    example: '25*25',
  })
  @IsNotEmpty()
  @IsString()
  paper_size: string;

  @ApiPropertyOptional({
    description: 'Remark or note for the QR code generation',
    example: 'For campaign XYZ',
  })
  @IsOptional()
  @IsString()
  remark: string;

  @ApiPropertyOptional({
    description: 'Additional data or form metadata',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  form_data?: Record<string, any>;
}
export class ItemDto {
  @ApiProperty({
    description: 'QR Code type',
    enum: QrCodeType,
    example: QrCodeType.BOX,
  })
  @IsNotEmpty()
  @IsEnum(QrCodeType)
  qrcode_type: QrCodeType;
}

export class ReadQrDto {
  @ApiPropertyOptional({
    description: 'Filters for searching or filtering results',
    type: Object,
    example: { field_name: 'Xyz' },
  })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiPropertyOptional({ description: 'Limit per page', example: 10 })
  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({
    description: 'QR code type filter',
    enum: QrCodeType,
    example: QrCodeType.ITEM,
  })
  @IsNotEmpty()
  @IsEnum(QrCodeType)
  qrcode_type: QrCodeType;
}

export class ReadQrHistoryDto {
  @ApiPropertyOptional({
    description: 'Filters for QR code history',
    type: Object,
    example: { field_name: 'Xyz' },
  })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiPropertyOptional({ description: 'Limit per page', example: 10 })
  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  page?: number = 1;
}

export class ReadScanQrDto {

  @ApiPropertyOptional({
    description: 'QR code scan history record ID',
    example: '6614e43fe7b2345b3d123abc',
  })
  @IsString()
  @IsOptional()
  @IsMongoId()
  _id: string;

  @ApiPropertyOptional({
    description: 'Filters for QR code history',
    type: Object,
    example: { field_name: 'Xyz' },
  })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiPropertyOptional({ description: 'Limit per page', example: 10 })
  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  page?: number = 1;
}

export class PrintQrDto {

  @ApiPropertyOptional({
    description: 'QR code scan history record ID',
    example: '6614e43fe7b2345b3d123abc',
  })
  @IsString()
  @IsOptional()
  @IsMongoId()
  _id: string;

  @ApiProperty({
    description: 'QR code print status',
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  is_printed: boolean;
}

export class StatusChangeDto {

  @ApiPropertyOptional({
    description: 'QR code scan history record ID',
    example: '6614e43fe7b2345b3d123abc',
  })
  @IsString()
  @IsOptional()
  @IsMongoId()
  _id: string;

  @ApiProperty({
    description: 'QR code type (item, box, or point_category)',
    enum: status,
    example: status.ACTIVE,
  })
  @IsNotEmpty()
  @IsEnum(status)
  status: status;
}

export class DeleteQrHistoryDto {

  @ApiPropertyOptional({
    description: 'QR code scan history record ID',
    example: '6614e43fe7b2345b3d123abc',
  })
  @IsString()
  @IsOptional()
  @IsMongoId()
  _id: string;
}

export class DeleteQrDto {

  @ApiPropertyOptional({
    description: 'QR code scan history record ID',
    example: '6614e43fe7b2345b3d123abc',
  })
  @IsString()
  @IsOptional()
  @IsMongoId()
  _id: string;
}

export class DeleteMasterBoxDto {

  @ApiPropertyOptional({
    description: 'Delete Master Box',
    example: '6614e43fe7b2345b3d123abc',
  })
  @IsString()
  @IsOptional()
  @IsMongoId()
  _id: string;
}

export class QrReopenQrDto {

  @ApiProperty({
    description: 'QR code ID',
    example: '6614e43fe7b2345b3d123abc',
  })
  @IsString()
  @IsMongoId()
  _id: string;
}

export class DetailQrHistoryDto {

  @ApiProperty({
    description: 'QR code scan history record ID',
    example: '6614e43fe7b2345b3d123abc',
  })
  @IsString()
  @IsMongoId()
  _id: string;
}

export class QrDropDownDto {
  @ApiProperty({
    description: 'Drop Down Key',
    example: 'sub_category',
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: 'Product ID',
    example: '6614e43fe7b2345b3d123abc',
  })
  @IsString()
  @IsMongoId()
  product_id: string;
}

export class CreateMasterBoxDto {
  @ApiProperty({
    description: 'Product ID',
    example: '6614e43fe7b2345b3d123abc',
  })
  @IsOptional()
  @IsString()
  @IsMongoId()
  dispatch_id: string;
}

export class ReadMasterQrDto {
  @ApiPropertyOptional({
    description: 'Filters for searching or filtering results',
    type: Object,
    example: { field_name: 'Xyz' },
  })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiPropertyOptional({ description: 'Limit per page', example: 10 })
  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({
    description: 'Product ID',
    example: '6614e43fe7b2345b3d123abc',
  })
  @IsOptional()
  @IsString()
  @IsMongoId()
  dispatch_id: string;

  @ApiProperty({
    description: 'for pdf pass true else false',
    example: true,
  })
  @IsBoolean()
  pdf: boolean;
}

export class ReadMasterQrDropdownDto {
  @ApiProperty({
    description: 'Product ID',
    example: '6614e43fe7b2345b3d123abc',
  })
  @IsOptional()
  @IsString()
  @IsMongoId()
  dispatch_id: string;
}

export class MasterBoxScanDto {
  @ApiProperty({
    description: 'gatepass id',
    example: '6614e43fe7b2345b3d123abc',
  })
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  gatepass_id: string;

  @ApiProperty({
    description: 'Master Box Code',
    example: 'MBhjdhdadhdda31d',
  })
  @IsNotEmpty()
  @IsString()
  master_box_code: string;
}


