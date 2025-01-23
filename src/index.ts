// index.ts
import express from 'express';
import http from 'http';
import cors from 'cors';
import { init } from './socketManager.js';
import { setupChat } from './chat.js';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors({
  origin: '*'
}));

const server = http.createServer(app);

// Serve static files (debug)
app.use(express.static('public'));

// Initialize the Socket.IO server
init(server);

// Set up each functionality
setupChat();

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
