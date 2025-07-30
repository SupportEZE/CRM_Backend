import { IsString, IsInt, IsNotEmpty, IsEnum, ValidateIf, IsMongoId, IsOptional, IsObject } from 'class-validator';

export class AppVersionReadDTO {

  @IsString()
  @IsNotEmpty()
  app_id: string;

}
