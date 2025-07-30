import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { DownloaderService } from './downloader.service';
import { JwtWsGuard } from 'src/modules/auth/guards/jwt-ws.guard';

interface ClientState {
  skip: number;
  batchSize: number;
  isPaused: boolean;
  totalCount: number;
}

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket'],
})
@Injectable()
export class DownloaderGatewayService implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clientStates = new Map<string, ClientState>();

  constructor(private readonly downloaderService: DownloaderService) { }

  handleConnection(client: Socket) {
    console.info(`✅ Export Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // this.clientStates.delete(client.id);
    console.info(`🔴 Export Client disconnected: ${client.id}`);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('download-data')
  async downloader(@ConnectedSocket() client: Socket, @MessageBody() params?: any) {
    console.info('📥 Received download request', params);

    let state = this.clientStates.get(client.id);
    if (!state) {
      state = { skip: 0, batchSize: 3, isPaused: false, totalCount: 0 };
      this.clientStates.set(client.id, state);
    }

    if (params?.batchSize) state.batchSize = params.batchSize;
    state.isPaused = false;

    const response: any = await this.downloaderService.downloadProductData(client, state, params);

    if (response.statusCode === 201) {
      console.info('🚫 Closing connection for client:', client.id);
      client.emit('closeConnection', { message: 'Download complete. Closing connection.' });
      client.disconnect();
      this.handleDisconnect(client);
    } else {
      client.emit('download-response', { data: response });
    }
  }
}
