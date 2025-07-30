import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseFilters, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtWsGuard } from 'src/modules/auth/guards/jwt-ws.guard';
import { JoinRoomDto, MessageDto } from './dto/chat.dto';
import { GatewayService } from './gateway.service';
import { AllExceptionsWsFilter } from 'src/providers/ws-exception.filter';
@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  constructor(
    private readonly gatewayService: GatewayService,
  ) {}
  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    console.info(`✅ Web Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.info(`🔴 Web Client disconnected: ${client.id}`);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('supportJoinRoom')
  async joinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: JoinRoomDto) {
    client.join(data.room_id.toString());
    client.emit('supportRead', data);
    this.server.to(data.room_id.toString()).emit('supportRead', data);
    const user = (client as any).user;
    await this.gatewayService.readChatMessage(user,data)
  }

  @UseGuards(JwtWsGuard)
  @UseFilters(new AllExceptionsWsFilter())
  @SubscribeMessage('supportMessage')
  async supportMessage(
    @ConnectedSocket() client: Socket, 
    @MessageBody(new ValidationPipe()) data: MessageDto
  ) {
    try {

      const user = (client as any).user;
      client.join(data.room_id.toString());
      
      const room = this.server.sockets.adapter.rooms.get(data.room_id.toString());
      const numberOfClients = room?.size || 0;
      console.info(`Room ${data.room_id} now has ${numberOfClients} client(s)`);

      if (numberOfClients === 1){
        await this.gatewayService.notifyApp(user,data) 
      }else{
        await this.gatewayService.readChatMessage(user,data)
        client.emit('supportRead', data);
        this.server.to(data.room_id.toString()).emit('appRead', data);
      }

      await this.gatewayService.syncChat(client, user, data);
      client.emit('supportMessage', data);
      this.server.to(data.room_id.toString()).emit('supportMessage', data);
      console.info("supportMessage======",data.room_id);
    } catch (error) {
      console.error('supportMessage=====',error);
      client.emit('supportMessageError', error);
    }
  }


  @UseGuards(JwtWsGuard)
  @SubscribeMessage('unReadChats')
  async unReadChats(
    @ConnectedSocket() client: Socket, 
    @MessageBody() data: MessageDto
  ) {
    try {

      const user = (client as any).user;
      client.join(data.room_id.toString());
      
      const room = this.server.sockets.adapter.rooms.get(data.room_id.toString());
      const numberOfClients = room?.size || 0;
      console.info(`Room ${data.room_id} now has ${numberOfClients} client(s)`);

      if (numberOfClients === 1){
        await this.gatewayService.notifyApp(user,data) 
      }

      await this.gatewayService.syncChat(client, user, data);
      client.emit('supportMessage', data);
      this.server.to(data.room_id.toString()).emit('supportMessage', data);
      console.info("supportMessage======",data.room_id);
    } catch (error) {
      console.error('supportMessage=====',error);
      client.emit('supportMessageError', error);
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: any,
  ) {
    client.leave(roomId);
    console.info(`Client ${client.id} left room ${roomId}`);
  }
}
