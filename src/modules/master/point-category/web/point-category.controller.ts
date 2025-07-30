import { Body, Controller, Post, Req, Request, Patch } from '@nestjs/common';
import { PointCategoryService } from './point-category.service';
import { CreatePointCategoryDto, ReadPointCategoryDto, UpdatePointCategoryDto, DetailPointCategoryDto, ProductMapDto } from './dto/point-category.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { UpdateStatusDto } from '../../announcement/web/dto/announcement.dto';
@ApiTags('web-point-category')
@ApiBearerAuth('Authorization')
@Controller('point-category')
export class PointCategoryController {
    constructor(private readonly pointCategoryService: PointCategoryService) { }

    @ApiOperation({ summary: 'Create Point category.' })
    @ApiBody({ type: CreatePointCategoryDto })
    @Post('/create')
    async create(@Req() req: Request, @Body() params: CreatePointCategoryDto): Promise<CreatePointCategoryDto> {
        return await this.pointCategoryService.create(req, params);
    }
    @ApiOperation({ summary: 'Update Point Category.' })
    @ApiBody({ type: UpdatePointCategoryDto })
    @Patch('/update')
    async update(@Req() req: any, @Body() params: UpdatePointCategoryDto): Promise<UpdatePointCategoryDto> {
        return await this.pointCategoryService.update(req, params);
    }

    @ApiOperation({ summary: 'Read Point Category.' })
    @ApiBody({ type: ReadPointCategoryDto })
    @Post('/read')
    async read(@Req() req: any, @Body() params: ReadPointCategoryDto): Promise<ReadPointCategoryDto> {
        return await this.pointCategoryService.read(req, params);
    }

    @ApiOperation({ summary: 'detail Point Category.' })
    @ApiBody({ type: DetailPointCategoryDto })
    @Post('/detail')
    async detail(@Req() req: any, @Body() params: DetailPointCategoryDto): Promise<DetailPointCategoryDto> {
        return await this.pointCategoryService.detail(req, params);
    }

    @ApiOperation({ summary: 'List DropDown.' })
    @ApiBody({ type: ReadPointCategoryDto })
    @Post('/read-dropdown')
    async readDropdown(@Req() req: any, @Body() params: ReadPointCategoryDto): Promise<ReadPointCategoryDto> {
        return await this.pointCategoryService.readDropdown(req, params);
    }

    @ApiOperation({ summary: 'update Point Category status.' })
    @ApiBody({ type: UpdateStatusDto })
    @Patch('/update-status')
    async updateStatus(@Req() req: any, @Body() params: UpdateStatusDto): Promise<UpdateStatusDto> {
        return await this.pointCategoryService.updateStatus(req, params);
    }

    @ApiOperation({ summary: 'to map product with point category.' })
    @ApiBody({ type: ProductMapDto })
    @Post('/point-product-map')
    async pointProductMap(@Req() req: any, @Body() params: ProductMapDto): Promise<ProductMapDto> {
        return await this.pointCategoryService.pointProductMap(req, params);
    }
}
