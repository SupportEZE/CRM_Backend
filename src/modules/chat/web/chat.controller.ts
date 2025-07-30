import { Body, Controller, Post, Req,Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetRoomIdDto, ReadChatMessageDto } from './dto/chat.dto';
import { ChatRoomService } from './chat-room.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatRoomService: ChatRoomService,

  ) {}

  @Post('/pending-chats')
    async pendingChats(@Req() req: any, @Body() params:any): Promise<any> {
    return await this.chatService.pendingChats(req, params);
  }
  @Post('/read-chat-message')
    async readChatMessage(@Req() req: any, @Body() params:ReadChatMessageDto): Promise<ReadChatMessageDto> {
    return await this.chatService.readChatMessage(req, params);
  }
  @Post('/room-id')
    async getOrCreatePrivateChatRoom(@Req() req: Request, @Body() params:GetRoomIdDto): Promise<any> {
    return await this.chatRoomService.getOrCreatePrivateChatRoom(req, params);
  }

  @Post('/unread-chat-count')
  async unReadChatCount(@Req() req: Request, @Body() params:any): Promise<any> {
  return await this.chatService.unReadChatCount(req, params);
}

  
}
