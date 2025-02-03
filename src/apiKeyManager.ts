// apiKeyManager;ts
import fs from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { v4 as uuidv4 } from "uuid";
import logger from "./logger.js";

const API_KEYS_FILE = path.join(cwd(), "api_keys.json");

interface ApiKey {
	key: string;
	createdAt: string;
}

let apiKeys: ApiKey[] = [];

// Load API keys from the file
function loadApiKeys() {
	logger.debug(`Attempting to load API keys from ${API_KEYS_FILE}`);
	if (fs.existsSync(API_KEYS_FILE)) {
		const data = fs.readFileSync(API_KEYS_FILE, "utf-8");
		apiKeys = JSON.parse(data);
		logger.info(`Successfully loaded ${apiKeys.length} API keys`);
	} else {
		logger.warn(
			`API keys file not found at ${API_KEYS_FILE}. Starting with an empty list.`,
		);
	}
}

// Save API keys to the file
function saveApiKeys() {
	logger.debug(`Saving ${apiKeys.length} API keys to ${API_KEYS_FILE}`);
	fs.writeFileSync(API_KEYS_FILE, JSON.stringify(apiKeys, null, 2), "utf-8");
	logger.info("API keys saved successfully");
}

// Generate a new API key
export function generateApiKey(): string {
	const newKey = uuidv4();
	const newApiKey: ApiKey = {
		key: newKey,
		createdAt: new Date().toISOString(),
	};
	apiKeys.push(newApiKey);
	saveApiKeys();
	logger.info(`Generated new API key: ${newKey}`);
	return newKey;
}

// Validate an API key
export function validateApiKey(key: string): boolean {
	logger.debug(`Validating API key: ${key}`);
	const isValid = apiKeys.some((apiKey) => apiKey.key === key);
	if (isValid) {
		logger.info(`API key validation successful for key: ${key}`);
	} else {
		logger.warn(`API key validation failed for key: ${key}`);
	}
	return isValid;
}

// Initialize the API key manager
export function initApiKeyManager() {
	logger.debug("Initializing API key manager");
	loadApiKeys();
	logger.info("API key manager initialized");
}
