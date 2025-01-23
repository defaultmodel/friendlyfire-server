import { getIo } from './socketManager.js';
import { Socket } from 'socket.io'

let typingTimeout: NodeJS.Timeout | null = null;

export function setupChat() {
  const io = getIo();

  io.on('connection', (socket: Socket) => {
    console.log('New client connected');

    // Handle new message
    socket.on('chat message', (msg: string) => {
      io.emit('chat message', msg);
    });

    // Handle typing indicator
    socket.on('typing', (isTyping: boolean) => {
      console.log("typing")
      if (isTyping) {
        // Reset the timer each time a typing message arrives
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
        socket.emit('typing', true);
        typingTimeout = setTimeout(() => {
          socket.emit('typing', false);
        }, 3000);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
}

