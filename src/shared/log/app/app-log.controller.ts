import { Controller, Post, Body, Req, Request } from '@nestjs/common';
import { LogService } from '../log.service';
import { FormLogDto, ModuleTransactionLogDto, RealLogDto } from '../dto/log.dto';
@Controller('app-log')
export class AppLogController {
    constructor(private readonly logService: LogService) { }

    @Post('/form-action')
    async formAction(@Req() req: Request, @Body() params: FormLogDto): Promise<FormLogDto> {
        return this.logService.formAction(req, params)
    }
    @Post('/transaction-action')
    async transactionAction(@Req() req: Request, @Body() params: ModuleTransactionLogDto): Promise<ModuleTransactionLogDto> {
        return this.logService.transactionAction(req, params)
    }

    @Post('/read')
    async read(@Req() req: Request, @Body() params: RealLogDto): Promise<RealLogDto> {
        return this.logService.read(req, params)
    }
}
