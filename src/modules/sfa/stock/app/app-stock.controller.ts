import { Controller, Post, Body, Req } from '@nestjs/common';
import { AppStockService } from './app-stock.service';
import { AppCreateStockAuditDto, AppReadStockAuditDto, AppDetailStockAuditDto } from '../app/dto/app-stock.dto';
import {ApiTags, ApiBearerAuth, ApiOperation, ApiBody} from '@nestjs/swagger';

@ApiTags('App-Stock')
@ApiBearerAuth('Authorization')
@Controller('app-stock')
export class AppStockController {
  constructor(private readonly appstockService: AppStockService) {}

  @Post('/create-stock-audit')
  @ApiOperation({ summary: 'Create a stock audit entry for a customer' })
  @ApiBody({ type: AppCreateStockAuditDto })
  async create(@Req() req: any,@Body() params: AppCreateStockAuditDto): Promise<AppCreateStockAuditDto> {
    return await this.appstockService.createstockAudit(req, params);
  }

  @Post('/read-stock-audit')
  @ApiOperation({ summary: 'Read stock audit data with filters and pagination' })
  @ApiBody({ type: AppReadStockAuditDto })
  async read(@Req() req: any,@Body() params: AppReadStockAuditDto): Promise<AppReadStockAuditDto> {
    return await this.appstockService.readstockAudit(req, params);
  }

  @Post('/detail-stock-audit')
  @ApiOperation({ summary: 'Detail stock audit data' })
  @ApiBody({ type: AppDetailStockAuditDto })
  async detail(@Req() req: any,@Body() params: AppDetailStockAuditDto): Promise<AppDetailStockAuditDto> {
    return await this.appstockService.detailstockAudit(req, params);
  }
}
