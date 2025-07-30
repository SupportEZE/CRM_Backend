import { Body, Controller, Post, Req, Request, Patch } from '@nestjs/common';
import { VideosService } from './videos.service';
import { CreateVideoDto, DeleteVideoDto, UpdateVideoDto } from './dto/videos.dto';

@Controller('videos')
export class VideosController {
  constructor(
    private readonly videosService: VideosService

  ) { }

  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateVideoDto): Promise<CreateVideoDto> {
    return await this.videosService.create(req, params);
  }
  @Post('/update')
  async update(@Req() req: Request, @Body() params: UpdateVideoDto): Promise<UpdateVideoDto> {
    return await this.videosService.update(req, params);
  }
  @Post('/read')
  async read(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.videosService.read(req, params);
  }
  @Patch('/delete')
  async delete(@Req() req: Request, @Body() params: DeleteVideoDto): Promise<DeleteVideoDto> {
    return this.videosService.delete(req, params);
  }
}
