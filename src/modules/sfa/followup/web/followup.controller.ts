import { Body, Controller, Patch, Post, Req, Request, Param, Query } from '@nestjs/common';
import { FollowupService } from './followup.service';
import { CreateFollowupDto, UpdateFollowupDto, ReadFollowupDto,DeleteFollowupDto,StatusUdateFollowupDto} from './dto/followup.dto';

@Controller('followup')
export class FollowupController {
  constructor(private readonly followupService: FollowupService) { }

  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateFollowupDto): Promise<CreateFollowupDto> {
    return await this.followupService.create(req, params);
  }

  @Patch('/update')
  async update(@Req() req: Request, @Body() params: UpdateFollowupDto): Promise<UpdateFollowupDto> {
    return this.followupService.update(req, params);
  }

  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadFollowupDto): Promise<ReadFollowupDto> {
    return this.followupService.read(req, params);
  }

  @Patch('/delete')
  async delete(@Req() req: Request, @Body() params: DeleteFollowupDto): Promise<DeleteFollowupDto> {
    return this.followupService.delete(req, params);
  }

  @Post('/categories')
  async categories(@Req() req: Request, @Body() params: any): Promise<any> {
    return this.followupService.categories(req, params);
  }

  @Patch('/status-update')
  async statusUpdate(@Req() req: Request, @Body() params: StatusUdateFollowupDto): Promise<StatusUdateFollowupDto> {
    return this.followupService.statusUpdate(req, params);
  }

}