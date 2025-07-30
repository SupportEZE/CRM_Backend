import { Body, Controller, Post, Req, Request, Patch } from '@nestjs/common';
import { SpinWinService } from './spin-win.service';
import { CreateSpinWinDto, ReadSpinWinDto, UpdateSpiWinStatusDto, SpinWinDetailDto, UpdateSpinWinDto } from './dto/spin-win-dto';

@Controller('spin-win')
export class SpinWinController {
    constructor(private readonly spinWinService: SpinWinService) { }

    @Post('/create')
    async create(@Req() req: Request, @Body() params: CreateSpinWinDto): Promise<CreateSpinWinDto> {
        return await this.spinWinService.create(req, params);
    }
    @Post('/read')
    async read(@Req() req: any, @Body() params: ReadSpinWinDto): Promise<ReadSpinWinDto> {
        return await this.spinWinService.read(req, params);
    }

    @Patch('/update-status')
    async updateStatus(@Req() req: any, @Body() params: UpdateSpiWinStatusDto): Promise<UpdateSpiWinStatusDto> {
        return await this.spinWinService.updateStatus(req, params);
    }

    @Post('/update')
    async updateSpinWin(@Req() req: any, @Body() params: UpdateSpinWinDto): Promise<UpdateSpinWinDto> {
        return await this.spinWinService.updateSpinWin(req, params);
    }

    @Post('/detail')
    async detail(@Req() req: any, @Body() params: SpinWinDetailDto): Promise<SpinWinDetailDto> {
        return await this.spinWinService.detail(req, params);
    }
}
