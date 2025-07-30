import { Body, Controller, Post, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { DispatchReadDto, DispatchDetailDto, ItemsDetailDto, DispatchQrDto, DispatchPlanDTO, ExcessReturnDTO, ManualDispatchDto } from './dto/dispatch.dto';

@ApiTags('Dispatch')
@ApiBearerAuth('Authorization')
@Controller('dispatch')
export class DispatchController {
    constructor(
        private readonly dispatchService: DispatchService,
    ) { }

    @ApiOperation({ summary: 'Plan Dispatch' })
    @Post('/dispatch-plan')
    async dispatchPlan(@Req() req: any, @Body() params: DispatchPlanDTO): Promise<DispatchPlanDTO> {
        return await this.dispatchService.dispatchPlan(req, params);
    }

    @ApiOperation({ summary: 'excess item return to order' })
    @Post('/excess-item-return')
    async excessItemReturnToOrder(@Req() req: any, @Body() params: ExcessReturnDTO): Promise<ExcessReturnDTO> {
        return await this.dispatchService.excessItemReturnToOrder(req, params);
    }

    @ApiOperation({ summary: 'Read Dispatch List.' })
    @ApiBody({ type: DispatchReadDto })
    @Post('/read')
    async read(@Req() req: any, @Body() params: DispatchReadDto): Promise<DispatchReadDto> {
        return await this.dispatchService.read(req, params);
    }

    @ApiOperation({ summary: 'detail of Dispatch record.' })
    @ApiBody({ type: DispatchDetailDto })
    @Post('/detail')
    async detail(@Req() req: any, @Body() params: DispatchDetailDto): Promise<DispatchDetailDto> {
        return await this.dispatchService.detail(req, params);
    }

    @ApiOperation({ summary: 'items of Dispatch record.' })
    @ApiBody({ type: ItemsDetailDto })
    @Post('/items')
    async items(@Req() req: any, @Body() params: ItemsDetailDto): Promise<ItemsDetailDto> {
        return await this.dispatchService.items(req, params);
    }

    @ApiOperation({ summary: 'Dispatch Qr.' })
    @ApiBody({ type: DispatchQrDto })
    @Post('/dispatch-qr-code')
    async dispatchQrCode(@Req() req: any, @Body() params: DispatchQrDto): Promise<DispatchQrDto> {
        return await this.dispatchService.dispatchQrCode(req, params);
    }

    @ApiOperation({ summary: 'Manaul Dispatch.' })
    @ApiBody({ type: ManualDispatchDto })
    @Post('/manual-dispatch')
    async manualDispatch(@Req() req: any, @Body() params: ManualDispatchDto): Promise<ManualDispatchDto> {
        return await this.dispatchService.manualDispatch(req, params);
    }
}
