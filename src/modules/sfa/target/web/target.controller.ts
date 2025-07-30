import { Body, Controller, Post, Req, Patch,Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TargetService } from './target.service';
import { AchievementDto, CreateTargetDto, ReadTargetDto, UpdateTargetDto } from './dto/target.dto';
import { _IdDto, DeleteDto } from 'src/common/dto/common.dto';

@ApiTags('Web-Target')
@ApiBearerAuth('Authorization')
@Controller('target')
export class TargetController {
  constructor(private readonly targetService: TargetService) {}
  
  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateTargetDto): Promise<any> {
    return await this.targetService.create(req, params);
  }
  
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadTargetDto): Promise<any> {
    return await this.targetService.read(req, params);
  }
  
  @Post('/detail')
  async detail(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.targetService.detail(req, params);
  }
  
  @Patch('/delete')
  async delete(@Req() req: Request, @Body() params: DeleteDto): Promise<DeleteDto> {
    return await this.targetService.delete(req, params);
  }
  
  @Patch('/update')
  async update(@Req() req: Request, @Body() params: UpdateTargetDto): Promise<any> {
    return await this.targetService.update(req, params);
  }   
  
  @Post('/achievement')
  async achievement(@Req() req: Request, @Body() params: AchievementDto): Promise<AchievementDto> {
    return await this.targetService.achievement(req, params);
  }   
  
  @Post('/assign-customer-achievement')
  async assignCustomerAchievementData(@Req() req: Request, @Body() params: AchievementDto): Promise<AchievementDto> {
    return await this.targetService.assignCustomerAchievementData(req, params);
  }   
  
}
