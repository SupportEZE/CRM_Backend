import { Body, Get, Controller, Post, Req, Request, Patch } from '@nestjs/common';
import { ZoneMasterService } from './zone-master.service';
import { ReadZoneDto, CreateZoneDto, UpdateZoneDto, DeleteZoneDto } from './dto/zone-master.dto';

@Controller('zone-master')
export class ZoneMasterController {
    constructor(private readonly zonemasterService: ZoneMasterService) { }

    @Post('/read')
    async read(@Req() req: Request, @Body() params: ReadZoneDto): Promise<ReadZoneDto> {
        return await this.zonemasterService.read(req, params);
    }
    @Post('/create')
    async create(@Req() req: Request, @Body() params: CreateZoneDto): Promise<any> {
        return await this.zonemasterService.create(req, params);
    }
    @Patch('/update')
    async update(@Req() req: any, @Body() params: UpdateZoneDto): Promise<any> {
        return await this.zonemasterService.update(req, params);
    }
    @Patch('/delete')
    async delete(@Req() req: Request, @Body() params: DeleteZoneDto): Promise<DeleteZoneDto> {
        return await this.zonemasterService.delete(req, params);
    }
}
