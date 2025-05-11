import logger from "./logger.js";

const users: { [socketId: string]: string } = {}; // Store usernames by socket ID

export function registerUsername(
	socketId: string,
	username: string,
): string | null {
	try {
		if (Object.values(users).includes(username)) {
			logger.warn(`Username "${username}" is already taken`);
			return null;
		}

		users[socketId] = username; // Associate username with socket ID
		logger.info(`Username "${username}" registered for socket ${socketId}`);
		return username;
	} catch (error) {
		logger.error(
			`Error registering username: ${error instanceof Error ? error.message : error}`,
		);
		return null;
	}
}

export function removeUsername(socketId: string): string | null {
	try {
		const username = users[socketId];
		if (username) {
			logger.info(`Client disconnected: ${username}`);
			delete users[socketId]; // Remove user from the list
			return username;
		}

		logger.info(`Unregistered client disconnected: ${socketId}`);
		return null;
	} catch (error) {
		logger.error(
			`Error removing username: ${error instanceof Error ? error.message : error}`,
		);
		return null;
	}
}

export function getUsername(socketId: string): string | null {
	try {
		return users[socketId] || null;
	} catch (error) {
		logger.error(
			`Error getting username: ${error instanceof Error ? error.message : error}`,
		);
		return null;
	}
}

export function getAllUsernames(): string[] {
	try {
		return Object.values(users);
	} catch (error) {
		logger.error(
			`Error getting all usernames: ${error instanceof Error ? error.message : error}`,
		);
		return [];
	}
}
