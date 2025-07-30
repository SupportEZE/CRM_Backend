import { Body, Controller, Post, Req,Request } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/contact.dto';

@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService

  ) {}

  @Post('/create')
    async create(@Req() req: Request, @Body() params:CreateContactDto): Promise<CreateContactDto> {
      return await this.contactService.create(req, params);
  }
  @Post('/read')
  async read(@Req() req: Request, @Body() params:any): Promise<any> {
    return await this.contactService.read(req, params);
  }
}
