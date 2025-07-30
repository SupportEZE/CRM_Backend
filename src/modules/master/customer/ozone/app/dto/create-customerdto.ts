import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsObject,
  IsArray,
  IsNumber,
  Min,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
