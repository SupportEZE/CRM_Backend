import { Body, Controller, Post, Req, Request, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
import { BeatRouteService } from './beat-route.service';
import { ReadBeatRouteDto, CreateBeatRouteDto, UpdateBeatRouteDto, DeleteBeatRouteDto, BeatRouteImportDto, ReadDropdownDto, AssignBeatRouteDto, UnAssignBeatRouteDto } from './dto/beat-route.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { BeatRouteUploadService } from '../beat-route-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
@ApiTags('Web-Beat-Route')
@ApiBearerAuth('Authorization')
@Controller('beat-route')
export class BeatRouteController {
    constructor(
        private readonly beatrouteService: BeatRouteService,
        private readonly sharedUserService: SharedUserService,
        private readonly beatRouteUploadService: BeatRouteUploadService
    ) { }
    @ApiOperation({ summary: 'Read Beat Route' })
    @ApiBody({ type: ReadBeatRouteDto })
    @Post('/read')
    async read(@Req() req: Request, @Body() params: ReadBeatRouteDto): Promise<ReadBeatRouteDto> {
        return await this.beatrouteService.read(req, params);
    }

    @ApiOperation({ summary: 'Create Beat Route' })
    @ApiBody({ type: CreateBeatRouteDto })
    @Post('/create')
    async create(@Req() req: Request, @Body() params: CreateBeatRouteDto): Promise<any> {
        return await this.beatrouteService.create(req, params);
    }

    @ApiOperation({ summary: 'Update Beat Route' })
    @ApiBody({ type: UpdateBeatRouteDto })
    @Patch('/update')
    async update(@Req() req: any, @Body() params: UpdateBeatRouteDto): Promise<any> {
        return await this.beatrouteService.update(req, params);
    }

    @ApiOperation({ summary: 'Delete Beat Route' })
    @ApiBody({ type: DeleteBeatRouteDto })
    @Patch('/delete')
    async delete(@Req() req: Request, @Body() params: DeleteBeatRouteDto): Promise<DeleteBeatRouteDto> {
        return await this.beatrouteService.update(req, params);
    }

    @ApiOperation({ summary: 'Import Beat Route' })
    @ApiBody({ type: BeatRouteImportDto })
    @Post('/import')
    async import(@Req() req: Request, @Body() params: BeatRouteImportDto): Promise<BeatRouteImportDto> {
        return await this.beatrouteService.import(req, params);
    }

    @Post('/read-dropdown')
    async readDropdown(@Req() req: Request, @Body() params: ReadDropdownDto): Promise<ReadDropdownDto> {
        return await this.beatrouteService.readDropdown(req, params);
    }

    @ApiOperation({ summary: 'Assign Beat Route To User' })
    @ApiBody({ type: AssignBeatRouteDto })
    @Patch('/assign-beat')
    async assignBeatToUser(@Req() req: Request, @Body() params: AssignBeatRouteDto): Promise<AssignBeatRouteDto> {
        return await this.sharedUserService.assignBeatToUser(req, params);
    }

    @ApiOperation({ summary: 'UnAssign Beat Route To User' })
    @ApiBody({ type: UnAssignBeatRouteDto })
    @Patch('/unassign-beat')
    async unassignBeatFromUsers(@Req() req: Request, @Body() params: UnAssignBeatRouteDto): Promise<UnAssignBeatRouteDto> {
        return await this.sharedUserService.unassignBeatFromUsers(req, params);
    }

    @Post('upload-csv')
    @UseInterceptors(FileInterceptor('file'))
    async uploadBeatData(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
        return await this.beatRouteUploadService.uploadBeatData(req, file);
    }

    @Post('upload-csv-v2')
    @UseInterceptors(FileInterceptor('file'))
      async uploadBeatDataV2(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
      return await this.beatRouteUploadService.uploadBeatDataV2(req, file);
    }
}
