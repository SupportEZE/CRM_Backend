import { Body, Controller, Post, Req, Request, Patch } from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto, UpdateFaqDto, FaqDeleteDto } from './dto/faq.dto';

@Controller('faq')
export class FaqController {
  constructor(
    private readonly faqService: FaqService

  ) { }
  @Post('/create')
  async create(@Req() req: any, @Body() params: CreateFaqDto): Promise<any> {
    return await this.faqService.create(req, params);
  }
  @Patch('/update')
  async update(@Req() req: any, @Body() params: UpdateFaqDto): Promise<any> {
    return await this.faqService.update(req, params);
  }
  @Post('/read')
  async read(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.faqService.read(req, params);
  }
  @Patch('/delete')
  async delete(@Req() req: Request, @Body() params: FaqDeleteDto) {
    return this.faqService.delete(req, params);
  }
}
