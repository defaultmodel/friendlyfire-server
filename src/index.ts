// index.ts
import logger, { setLogFormat, setLogLevel } from "./logger.js";
import { type CliOptions, parseCliOptions } from "./cliOptions.js";

// Initialize globals and important stuff
const cliOptions: CliOptions = parseCliOptions();
// Initialize logger early, because of order of initialization
// If ran later the logger is not initialized when other files are imported
setLogLevel(cliOptions.logLevel);
setLogFormat(cliOptions.logFormat);
const SERVER_VERSION = process.env.npm_package_version as string;

import http from "node:http";
import path from "node:path";
import cors from "cors";
import express from "express";
import type { Server, Socket } from "socket.io";
import { initApiKeyManager, validateApiKey } from "./apiKeyManager.js";
import imageRouter from "./image.js";
import { init } from "./socketManager.js";
import {
	getAllUsernames,
	getUsername,
	registerUsername,
	removeUsername,
} from "./userManager.js";
import { exit } from "node:process";
import semver from "semver";

// Validate server version
function validateServerVersion(version: string): void {
	if (!semver.valid(version)) {
		logger.error(
			`Server is trying to start with an invalid version "${version}", expecting a valid "Semantic Versioning 2.0.0"`,
		);
		exit(1);
	}
}

// Initialize Express app and middleware
function initializeApp(): express.Application {
	const app = express();
	app.use(cors({ origin: "*" }));
	// app.use(express.static("public"));
	// logger.debug("Static files served from 'public' directory");

	const uploadsDir = path.join(cliOptions.uploadDir, "images");
	app.use("/uploads/images", express.static(uploadsDir));
	logger.debug(`Serving uploaded images from ${uploadsDir}`);

	app.use("/", imageRouter(cliOptions.uploadDir));

	return app;
}

// Validate client version against server version
function validateClientVersion(clientVersion: string): boolean {
	if (!clientVersion || !semver.valid(clientVersion)) {
		return false;
	}

	const serverMajorMinor = `${semver.major(SERVER_VERSION)}.${semver.minor(SERVER_VERSION)}`;
	const clientMajorMinor = `${semver.major(clientVersion)}.${semver.minor(clientVersion)}`;

	return serverMajorMinor === clientMajorMinor;
}

// Socket.IO middleware for authentication and validation
function socketMiddleware(socket: Socket, next: (err?: Error) => void): void {
	const apiKey = socket.handshake.auth.key;
	const username = socket.handshake.auth.username;
	const clientVersion = socket.handshake.auth.version;

	if (!validateApiKey(apiKey)) {
		next(new Error("Invalid API key"));
		return;
	}

	if (!validateClientVersion(clientVersion)) {
		next(new Error("Client version is invalid or mismatched"));
		return;
	}

	if (!registerUsername(socket.id, username)) {
		next(new Error("Username already taken"));
		return;
	}

	next();
}

// Handle socket connection events
function handleSocketConnection(io: Server, socket: Socket): void {
	const username = getUsername(socket.id);
	logger.debug(`New client connected: ${socket.id}`);
	logger.info(`New user connected: ${username}`);

	socket.on("ready", () => {
		const allUsernames = getAllUsernames();
		io.emit("user list", allUsernames);
		logger.debug(`Broadcasting list of all users [${allUsernames}]`);
	});

	socket.on("disconnect", () => {
		logger.info(`User disconnected: ${username}`);
		logger.debug(`Client disconnected: ${socket.id}`);
		if (removeUsername(socket.id)) {
			logger.debug(`Removed user ${username} from the users list`);
		} else {
			logger.warn(
				`Could not remove ${username} from the users list on disconnect`,
			);
		}
		const allUsernames = getAllUsernames();
		io.emit("user list", allUsernames);
	});
}

// Start the server
function startServer(server: http.Server, port: number): void {
	server.listen(port, () => {
		logger.info(`Server is running on port ${port} on v${SERVER_VERSION}`);
	});
}

// Main function to initialize and start the server
function main(): void {
	validateServerVersion(SERVER_VERSION);

	const app = initializeApp();
	const server = http.createServer(app);

	const io = init(server);
	logger.info("Socket.IO server initialized");

	initApiKeyManager();

	io.use(socketMiddleware);
	io.on("connection", (socket: Socket) => handleSocketConnection(io, socket));

	startServer(server, cliOptions.port);
}

main();
