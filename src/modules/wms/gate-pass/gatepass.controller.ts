import { Body, Controller, Post, Patch, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { GatepassService } from './gatepass.service';
import { GenrateGatePassDto, ReadGatepassDto, UpdateGatePassDto, DetailGatepassDto, MasterBoxDetailDto } from './dto/gatepass.dto';

@ApiTags('Gatepass')
@ApiBearerAuth('Authorization')
@Controller('gatepass')
export class GatepassController {
    constructor(
        private readonly gatepassService: GatepassService,
    ) { }


    @ApiOperation({ summary: 'Genrate Gatepass' })
    @ApiBody({ type: GenrateGatePassDto })
    @Post('/create')
    async create(@Req() req: any, @Body() params: GenrateGatePassDto): Promise<GenrateGatePassDto> {
        return await this.gatepassService.create(req, params);
    }

    @ApiOperation({ summary: 'Update Gatepass' })
    @ApiBody({ type: UpdateGatePassDto })
    @Patch('/update')
    async update(@Req() req: any, @Body() params: UpdateGatePassDto): Promise<UpdateGatePassDto> {
        return await this.gatepassService.update(req, params);
    }

    @ApiOperation({ summary: 'Gatepass list' })
    @ApiBody({ type: ReadGatepassDto })
    @Post('/read')
    async read(@Req() req: any, @Body() params: ReadGatepassDto): Promise<ReadGatepassDto> {
        return await this.gatepassService.read(req, params);
    }

    @ApiOperation({ summary: 'Gatepass Detail' })
    @ApiBody({ type: DetailGatepassDto })
    @Post('/detail')
    async detail(@Req() req: any, @Body() params: DetailGatepassDto): Promise<DetailGatepassDto> {
        return await this.gatepassService.detail(req, params);
    }

    @ApiOperation({ summary: 'Master Box Detail' })
    @ApiBody({ type: MasterBoxDetailDto })
    @Post('/master-box-detail')
    async masterBoxdetail(@Req() req: any, @Body() params: MasterBoxDetailDto): Promise<MasterBoxDetailDto> {
        return await this.gatepassService.masterBoxdetail(req, params);
    }
}
