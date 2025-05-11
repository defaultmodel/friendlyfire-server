import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import logger from "./logger.js";

let io: Server | null = null;

export function init(server: HttpServer): Server {
	if (!io) {
		try {
			io = new Server(server, {
				cors: {
					origin: "*",
					credentials: true,
				},
			});
			logger.info("Socket.IO server initialized");
		} catch (error) {
			logger.error(
				`Error initializing Socket.IO server: ${error instanceof Error ? error.message : error}`,
			);
			throw error;
		}
	}
	return io;
}

export function getIo(): Server {
	if (!io) {
		const error = new Error("Socket.IO not initialized!");
		logger.error(error.message);
		throw error;
	}
	return io;
}
