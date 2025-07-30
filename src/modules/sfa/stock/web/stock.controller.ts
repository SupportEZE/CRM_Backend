import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { CreateStockAuditDto, ReadStockAuditDto, DetailStockAuditDto } from './dto/stock.dto';

@ApiTags('Stock')
@ApiBearerAuth('Authorization')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('/create-stock-audit')
  @ApiOperation({ summary: 'Create stock audit for a customer' })
  @ApiBody({ type: CreateStockAuditDto })
  async create(@Req() req: any,@Body() params: CreateStockAuditDto): Promise<CreateStockAuditDto> {
    return await this.stockService.createstockAudit(req, params);
  }

  @Post('/read-stock-audit')
  @ApiOperation({ summary: 'Read stock audit data' })
  @ApiBody({ type: ReadStockAuditDto })
  async read(@Req() req: any,@Body() params: ReadStockAuditDto): Promise<ReadStockAuditDto> {
    return await this.stockService.readstockAudit(req, params);
  }

  @Post('/detail-stock-audit')
  @ApiOperation({ summary: 'Detail stock audit data' })
  @ApiBody({ type: DetailStockAuditDto })
  async detail(@Req() req: any,@Body() params: DetailStockAuditDto): Promise<DetailStockAuditDto> {
    return await this.stockService.detailstockAudit(req, params);
  }
}
