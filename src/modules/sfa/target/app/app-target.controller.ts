import { Body, Controller, Post, Req } from '@nestjs/common';
import { AppTargetService } from './app-target.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AppTargetReadDto } from '../web/dto/target.dto';

@ApiTags('App-Target')
@ApiBearerAuth('Authorization')
@Controller('app-target')
export class AppTargetController {
    constructor(private readonly apptargetService: AppTargetService) {}
    @Post('/read')
    async read(@Req() req: Request, @Body() params: AppTargetReadDto): Promise<AppTargetReadDto> {
        return await this.apptargetService.read(req, params);
    }
}
