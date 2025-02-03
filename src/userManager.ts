// usernameManager.ts
import logger from "./logger.js";

const users: { [socketId: string]: string } = {}; // Store usernames by socket ID

export function registerUsername(
	socketId: string,
	username: string,
): string | null {
	if (Object.values(users).includes(username)) {
		logger.warn(`Username "${username}" is already taken`);
		return null;
	}

	users[socketId] = username; // Associate username with socket ID
	logger.info(`Username "${username}" registered for socket ${socketId}`);
	return username;
}

export function removeUsername(socketId: string): string | null {
	const username = users[socketId];
	if (username) {
		logger.info(`Client disconnected: ${username}`);
		delete users[socketId]; // Remove user from the list
		return username;
	}

	logger.info(`Unregistered client disconnected: ${socketId}`);
	return null;
}

export function getUsername(socketId: string): string | null {
	return users[socketId] || null;
}

export function getAllUsernames(): string[] {
	return Object.values(users);
}
