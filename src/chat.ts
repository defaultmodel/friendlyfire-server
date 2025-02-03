// chat.ts
import { getIo } from "./socketManager.js";
import type { Socket } from "socket.io";
import logger from "./logger.js";

let typingTimeout: NodeJS.Timeout | null = null;
const users: { [socketId: string]: string } = {}; // Store usernames by socket ID

export function setupChat(socket: Socket) {
	const io = getIo();
	logger.info(`Setting up chat functionality for socket ${socket.id}`);

	// Handle username registration
	socket.on("register username", (username: string) => {
		if (Object.values(users).includes(username)) {
			logger.warn(`Username "${username}" is already taken`);
			socket.emit("username error", "Username is already taken");
		} else {
			users[socket.id] = username; // Associate username with socket ID
			logger.info(`Username "${username}" registered for socket ${socket.id}`);
			socket.emit("username accepted", username);
			io.emit("user joined", `${username} has joined the chat`); // Broadcast to all clients
		}
	});

	// Handle new message
	socket.on("chat message", (msg: string) => {
		const username = users[socket.id];
		if (username) {
			logger.debug(`Received chat message from ${username}: ${msg}`);
			io.emit("chat message", { username, message: msg }); // Broadcast message with username
		} else {
			logger.warn(`Received message from unregistered socket ${socket.id}`);
			socket.emit("username error", "Please register a username first");
		}
	});

	// Handle typing indicator
	socket.on("typing", (isTyping: boolean) => {
		const username = users[socket.id];
		if (username) {
			logger.debug(`Typing indicator from ${username}: ${isTyping}`);
			if (isTyping) {
				// Reset the timer each time a typing message arrives
				if (typingTimeout) {
					clearTimeout(typingTimeout);
					logger.debug(`Cleared existing typing timeout for ${username}`);
				}
				io.emit("typing", { username, isTyping: true }); // Broadcast typing indicator with username
				typingTimeout = setTimeout(() => {
					io.emit("typing", { username, isTyping: false });
					logger.debug(`Emitted typing=false for ${username} after timeout`);
				}, 3000);
			}
		} else {
			logger.warn(
				`Typing indicator received from unregistered socket ${socket.id}`,
			);
			socket.emit("username error", "Please register a username first");
		}
	});

	// Handle disconnection
	socket.on("disconnect", () => {
		const username = users[socket.id];
		if (username) {
			logger.info(`Client disconnected: ${username}`);
			delete users[socket.id]; // Remove user from the list
			io.emit("user left", `${username} has left the chat`); // Broadcast to all clients
		} else {
			logger.info(`Unregistered client disconnected: ${socket.id}`);
		}
	});
}
