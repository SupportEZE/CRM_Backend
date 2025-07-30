import { Body, Controller, Post, Req } from '@nestjs/common';
import { AppLedgerService } from './app-ledger.service';
import { AppReadLedgerDto, ReadWalletDto } from './dto/app-ledger.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
@ApiTags('App-ledger')
@ApiBearerAuth('Authorization')
@Controller('app-ledger')
export class AppLedgerController {
    constructor(
        private readonly appledgerService: AppLedgerService
    ) { }

    @ApiOperation({ summary: 'Fetch Ledger.' })
    @ApiBody({ type: AppReadLedgerDto })
    @Post('/read')
    async read(@Req() req: any, @Body() params: AppReadLedgerDto): Promise<AppReadLedgerDto> {
        return await this.appledgerService.read(req, params);
    }

    @ApiOperation({ summary: 'Fetch wallet.' })
    @ApiBody({ type: ReadWalletDto })
    @Post('/wallet')
    async wallet(@Req() req: any, @Body() params: ReadWalletDto): Promise<ReadWalletDto> {
        return await this.appledgerService.wallet(req, params);
    }
}
