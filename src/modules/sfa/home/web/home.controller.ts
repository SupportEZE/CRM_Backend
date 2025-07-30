import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { HomeService } from './home.service';

@ApiTags('Home')
@ApiBearerAuth('Authorization')
@Controller('home')
export class HomeController {
    constructor(
        private readonly homeService: HomeService

    ) { }

    @ApiOperation({ summary: 'To Fetch home page data.' })
    @Post('/read')
    async read(@Req() req: any, @Body() params: any): Promise<any> {
        return await this.homeService.read(req, params);
    }
}
