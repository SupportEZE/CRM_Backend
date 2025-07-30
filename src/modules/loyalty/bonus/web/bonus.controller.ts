import { Body, Controller, Post, Req, Patch } from '@nestjs/common';
import { BonusService } from './bonus.service';
import { CreateBonusDto, UpdateBonusDto, UpdatePointDto, ReadBonusDto, DetailBonusDto, UpdateBonusStatusDto, UpdateStatesDto } from './dto/bonus.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Web-Bonus')
@ApiBearerAuth('Authorization')
@Controller('bonus')
export class BonusController {
  constructor(
    private readonly bonusService: BonusService

  ) { }

  @ApiOperation({ summary: 'Created Bonus' })
  @ApiBody({ type: CreateBonusDto })
  @Post('/create')
  async create(@Req() req: any, @Body() params: CreateBonusDto): Promise<any> {
    return await this.bonusService.create(req, params);
  }

  @ApiOperation({ summary: 'Update Bonus' })
  @ApiBody({ type: UpdateBonusDto })
  @Post('/update')
  async update(@Req() req: any, @Body() params: UpdateBonusDto): Promise<any> {
    return await this.bonusService.update(req, params);
  }

  @ApiOperation({ summary: 'Bonus Lsit Data' })
  @ApiBody({ type: ReadBonusDto })
  @Post('/read')
  async read(@Req() req: any, @Body() params: ReadBonusDto): Promise<ReadBonusDto> {
    return await this.bonusService.read(req, params);
  }

  @ApiOperation({ summary: 'Bonus Detail' })
  @ApiBody({ type: DetailBonusDto })
  @Post('/detail')
  async detail(@Req() req: any, @Body() params: DetailBonusDto): Promise<DetailBonusDto> {
    return await this.bonusService.detail(req, params);
  }

  @ApiOperation({ summary: 'Bonus Status Update' })
  @ApiBody({ type: UpdateBonusStatusDto })
  @Patch('/update-status')
  async updateStatus(@Req() req: any, @Body() params: UpdateBonusStatusDto): Promise<any> {
    return await this.bonusService.updateStatus(req, params);
  }

  @Post('/read-point-category')
  async readPointCategory(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.bonusService.readPointCategory(req, params);
  }

  @ApiOperation({ summary: 'Update Point' })
  @ApiBody({ type: UpdatePointDto })
  @Post('/update-point')
  async updatePoint(@Req() req: any, @Body() params: UpdatePointDto): Promise<UpdatePointDto> {
    return await this.bonusService.updatePoint(req, params);
  }

  @ApiOperation({ summary: 'Update States' })
  @ApiBody({ type: UpdatePointDto })
  @Post('/update-states')
  async updateStates(@Req() req: any, @Body() params: UpdateStatesDto): Promise<UpdateStatesDto> {
    return await this.bonusService.updateStates(req, params);
  }
}
