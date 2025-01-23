import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const API_KEYS_FILE = path.join(__dirname, 'apiKeys.json');

interface ApiKey {
  key: string;
  createdAt: string;
}

let apiKeys: ApiKey[] = [];

// Load API keys from the file
function loadApiKeys() {
  if (fs.existsSync(API_KEYS_FILE)) {
    const data = fs.readFileSync(API_KEYS_FILE, 'utf-8');
    apiKeys = JSON.parse(data);
  }
}

// Save API keys to the file
function saveApiKeys() {
  fs.writeFileSync(API_KEYS_FILE, JSON.stringify(apiKeys, null, 2), 'utf-8');
}

// Generate a new API key
export function generateApiKey(): string {
  const newKey = uuidv4();
  const newApiKey: ApiKey = {
    key: newKey,
    createdAt: new Date().toISOString()
  };
  apiKeys.push(newApiKey);
  saveApiKeys();
  return newKey;
}

// Validate an API key
export function validateApiKey(key: string): boolean {
  return apiKeys.some(apiKey => apiKey.key === key);
}

// Initialize the API key manager
export function initApiKeyManager() {
  loadApiKeys();
}
