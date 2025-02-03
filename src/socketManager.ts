// socketManager.ts
import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";

let io: Server;

export function init(server: HttpServer): Server {
	if (!io) {
		io = new Server(server, {
			cors: {
				origin: "*",
				credentials: true,
			},
		});
	}
	return io;
}

export function getIo(): Server {
	if (!io) {
		throw new Error("Socket.IO not initialized!");
	}
	return io;
}
