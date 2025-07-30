import { Body, Controller, Post, Req } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { ReadLedgerDto, CreateLedgerDto, WalletLedgerDto } from './dto/ledger.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
@ApiTags('ledger')
@ApiBearerAuth('Authorization')
@Controller('ledger')
export class LedgerController {
  constructor(
    private readonly ledgerService: LedgerService

  ) { }

  @ApiOperation({ summary: 'Create Ledger manually' })
  @ApiBody({ type: CreateLedgerDto })
  @Post('/create-manual')
  async create(@Req() req: any, @Body() params: CreateLedgerDto): Promise<CreateLedgerDto> {
    return await this.ledgerService.create(req, params);
  }

  @ApiOperation({ summary: 'Fetch Ledger.' })
  @ApiBody({ type: ReadLedgerDto })
  @Post('/read')
  async read(@Req() req: any, @Body() params: ReadLedgerDto): Promise<ReadLedgerDto> {
    return await this.ledgerService.read(req, params);
  }


  @ApiOperation({ summary: 'Fetch wallet.' })
  @ApiBody({ type: WalletLedgerDto })
  @Post('/wallet')
  async wallet(@Req() req: any, @Body() params: WalletLedgerDto): Promise<WalletLedgerDto> {
    return await this.ledgerService.wallet(req, params);
  }
}
