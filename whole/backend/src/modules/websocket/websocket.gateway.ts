import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';

@NestWebSocketGateway({ cors: { origin: '*', methods: ['GET', 'POST'] } })
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(WebSocketGateway.name);

  constructor(private redis: RedisService) {
    // Subscribe to Redis pub/sub and broadcast to WS clients
    this.redis.subscribe('restaurant:*', (message: string) => {
      try {
        const { event, data } = JSON.parse(message);
        if (data?.restaurantId) {
          this.server.to(`restaurant:${data.restaurantId}`).emit(event, data);
        }
      } catch {}
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_restaurant')
  handleJoinRestaurant(@MessageBody() data: { restaurantId: string }, @ConnectedSocket() client: Socket) {
    client.join(`restaurant:${data.restaurantId}`);
    return { success: true };
  }

  @SubscribeMessage('join_table')
  handleJoinTable(@MessageBody() data: { tableId: string }, @ConnectedSocket() client: Socket) {
    client.join(`table:${data.tableId}`);
    return { success: true };
  }

  @SubscribeMessage('leave_restaurant')
  handleLeaveRestaurant(@MessageBody() data: { restaurantId: string }, @ConnectedSocket() client: Socket) {
    client.leave(`restaurant:${data.restaurantId}`);
    return { success: true };
  }

  broadcast(restaurantId: string, event: string, data: any) {
    this.server.to(`restaurant:${restaurantId}`).emit(event, data);
  }

  broadcastToTable(tableId: string, event: string, data: any) {
    this.server.to(`table:${tableId}`).emit(event, data);
  }
}
