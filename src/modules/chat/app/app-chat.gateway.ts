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
  import { Injectable, UseFilters, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtWsGuard } from 'src/modules/auth/guards/jwt-ws.guard';
import { GatewayService } from '../web/gateway.service';
import { AppMessageDto } from '../web/dto/chat.dto';
import { AllExceptionsWsFilter } from 'src/providers/ws-exception.filter';
  
  @WebSocketGateway({
    cors: { origin: '*' },
    transports: ['websocket'],
  })
  @Injectable()
  export class AppChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
      private readonly gatewayService: GatewayService,
    ) {}
  
    private onlineUsers = new Map<string, string>();

    @UseGuards(JwtWsGuard)
    async handleConnection(client: Socket) {
      const user = (client as any).user;
      if (user && user._id) {
        this.onlineUsers.set(user._id.toString(), client.id);
        console.info(`User ${user._id} app connected.`);
      }
    }
    async handleDisconnect(client: Socket) {
      const user = (client as any).user;
      if (user && user._id) {
        this.onlineUsers.delete(user._id.toString());
        console.info(`User ${user._id} app disconnected.`);
      }
    }


    @UseGuards(JwtWsGuard)
    @SubscribeMessage('joinRoom')
    async joinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
      try {
        const user = (client as any).user; 
        let roomId = await this.gatewayService.getOrCreatePrivateChatRoom(user,{})
        if(roomId){
          if(typeof roomId ==='string'){
            roomId = roomId;
          }else{
            roomId = roomId.toString()
          }
          client.join(roomId);
          client.emit('joinedRoom', roomId);
          client.emit('appRead', roomId);
          this.server.to(roomId.toString()).emit('appRead', data);
          console.info('joinedRoom=====',roomId);
          await this.gatewayService.readChatMessage(user,data)
        }
      } catch (error) {
        console.error('joinRoom====',error);
        client.emit('joinedRoomError', error);
      }
    }
    

    @UseGuards(JwtWsGuard)
    @UseFilters(new AllExceptionsWsFilter())
    @SubscribeMessage('appMessage')
    async appMessage(@ConnectedSocket() client: Socket, 
     @MessageBody(new ValidationPipe({ transform: true })) data: AppMessageDto
    ) {
      try {
        const user = (client as any).user; 
        client.join(data.room_id.toString());
  
        const room = this.server.sockets.adapter.rooms.get(data.room_id.toString());
        const numberOfClients = room?.size || 0;
        console.info(`Room ${data.room_id} now has ${numberOfClients} client(s)`);
  
        if (numberOfClients == 1){
          await this.gatewayService.notifySupport(user,data)
        }else{
          await this.gatewayService.readChatMessage(user,data)
          client.emit('appRead', data);
          this.server.to(data.room_id.toString()).emit('supportRead', data);
        }
        
        const chatId = await this.gatewayService.syncChat(client,user,data)

        client.emit('appMessage', data);
        client.emit('chatId', chatId);
        this.server.to(data.room_id.toString()).emit('appMessage', data);
        console.info("appMessage=====",data.room_id);
      } catch (error) {
        console.error('appMessage====',error);
        client.emit('appMessageError', error);
      }
    }


    @UseGuards(JwtWsGuard)
    @UseFilters(new AllExceptionsWsFilter())
    @SubscribeMessage('appStatus')
    async appStatus(@ConnectedSocket() client: Socket, 
     @MessageBody(new ValidationPipe({ transform: true })) data: any
    ) {
      try {
  
        const user = (client as any).user; 
        client.join(data.room_id.toString());
        const room = this.server.sockets.adapter.rooms.get(data.room_id.toString());
        const numberOfClients = room?.size || 0;
        console.info(`Room ${data.room_id} now has ${numberOfClients} client(s)`);

        console.info('appStatus====coming');
        
        if (numberOfClients == 2){
          client.emit('appStatus', data);
          this.server.to(data.room_id.toString()).emit('appStatus', data);
          console.info('appStatus====coming 1');

        }

      } catch (error) {
        console.error('appStatus====',error);
        client.emit('appStatusError', error);
      }
    }
  }
  