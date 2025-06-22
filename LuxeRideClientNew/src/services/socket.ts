import io from 'socket.io-client';

class SocketService {
  private socket: any;

  connect() {
    // Configuration basique - à adapter selon votre backend
    this.socket = io('ws://localhost:3000');
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export const socketService = new SocketService();
