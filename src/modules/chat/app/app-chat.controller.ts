import { Body, Controller, Post, Req } from '@nestjs/common';
import { AppChatService } from './app-chat.service';
import { ChatInitDto, ReadAppChatMessageDto } from './dto/chat-message.dto';

@Controller('app-chat')
export class AppChatController {
  constructor(
    private readonly appChatService: AppChatService
  )
    {}

  @Post('/init')
    async chatInit(@Req() req: any, @Body() params:ChatInitDto): Promise<ChatInitDto> {
    return await this.appChatService.chatInit(req, params);
  }
  @Post('/read-chat-message')
  async readChatMessage(@Req() req: any, @Body() params:ReadAppChatMessageDto): Promise<ReadAppChatMessageDto> {
   return await this.appChatService.readChatMessage(req, params);
  }
  @Post('/chat-tat')
  async chatTat(@Req() req: any, @Body() params:any): Promise<any> {
   return await this.appChatService.chatTat(req, params);
  }
  @Post('/notify-support')
  async notifySupport(@Req() req: any, @Body() params:any): Promise<any> {
   return await this.appChatService.notifySupport(req, params);
  }
}
