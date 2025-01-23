// index.ts
import express from 'express';
import http from 'http';
import cors from 'cors';
import { init } from './socketManager.js';
import { setupChat } from './chat.js';
import { initApiKeyManager, validateApiKey } from './apiKeyManager.js';

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

// Initialize the API key manager
initApiKeyManager();

// Middleware to validate API keys
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey && validateApiKey(apiKey)) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Set up each functionality
setupChat();

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

