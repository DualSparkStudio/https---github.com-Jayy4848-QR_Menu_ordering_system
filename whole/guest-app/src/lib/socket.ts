import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (socket) {
    return socket;
  }

  socket = io(WS_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const joinResort = (resortId: string) => {
  if (socket) {
    socket.emit('join_resort', { resortId });
  }
};

export const joinRoom = (roomId: string, resortId: string) => {
  if (socket) {
    socket.emit('join_room', { roomId, resortId });
  }
};

export const leaveResort = (resortId: string) => {
  if (socket) {
    socket.emit('leave_resort', { resortId });
  }
};

export const leaveRoom = (roomId: string) => {
  if (socket) {
    socket.emit('leave_room', { roomId });
  }
};

export const onOrderUpdate = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('order_updated', callback);
  }
};

export const onServiceRequestUpdate = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('service_request_updated', callback);
  }
};

export const onPaymentUpdate = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('payment_updated', callback);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
