// index.ts
import http from "node:http";
import path from "node:path";
import cors from "cors";
import express from "express";
import type { Socket } from "socket.io";
import { initApiKeyManager, validateApiKey } from "./apiKeyManager.js";
import imageRouter from "./image.js";
import logger from "./logger.js";
import { init } from "./socketManager.js";
import {
	getAllUsernames,
	getUsername,
	registerUsername,
	removeUsername,
} from "./userManager.js";
import { cwd, exit } from "node:process";
import semver from "semver";

const PORT = process.env.PORT || 3000;
const SERVER_VERSION = process.env.npm_package_version as string;

if (!semver.valid(SERVER_VERSION)) {
	logger.error(
		`Server is trying to start with a  invalid version "${SERVER_VERSION}", expecting a valid "Semantic Versioning 2.0.0"`,
	);
	exit(1);
}

const app = express();
app.use(
	cors({
		origin: "*",
	}),
);

const server = http.createServer(app);

// Serve static files (debug)
app.use(express.static("public"));
logger.debug("Static files served from 'public' directory");

// Serve uploaded images
const uploadsDir = path.join(cwd(), "uploads", "images");
app.use("/uploads/images", express.static(uploadsDir));
logger.debug(`Serving uploaded images from ${uploadsDir}`);

// Use the image router
app.use("/", imageRouter);

// Initialize the Socket.IO server
const io = init(server);
logger.info("Socket.IO server initialized");

// Initialize the API key manager
initApiKeyManager();

// Middleware to validate API keys
io.use((socket, next) => {
	const apiKey = socket.handshake.auth.key;
	const username = socket.handshake.auth.username;
	const clientVersion = socket.handshake.auth.version;

	// Validate API key
	const apiKeyRes = validateApiKey(apiKey);
	if (!apiKeyRes) {
		const error = new Error("Invalid API key");
		next(error);
		return;
	}

	// Validate client version
	if (!clientVersion) {
		const error = new Error("Client version is required");
		next(error);
		return;
	}
	if (!semver.valid(clientVersion)) {
		const error = new Error("Client version is badly ");
		next(error);
		return;
	}

	// Compare MAJOR and MINOR versions
	const serverMajorMinor = `${semver.major(SERVER_VERSION)}.${semver.minor(SERVER_VERSION)}`;
	const clientMajorMinor = `${semver.major(clientVersion)}.${semver.minor(clientVersion)}`;

	if (serverMajorMinor !== clientMajorMinor) {
		const error = new Error(
			`Version mismatch: Server is on ${serverMajorMinor}, and client is on ${clientMajorMinor}`,
		);
		next(error);
		return;
	}

	// Validate username
	const registeredUsername = registerUsername(socket.id, username);
	if (!registeredUsername) {
		const error = new Error("Username already taken");
		next(error);
		return;
	}

	next();
	return;
});

// Handle Socket.IO connections
io.on("connection", async (socket: Socket) => {
	const username = getUsername(socket.id);
	logger.debug(`New client connected: ${socket.id}`);
	logger.info(`New user connected: ${username}`);

	// Listen for the "ready" event from the client
	socket.on("ready", () => {
		// Broadcast the updated list of connected users to all clients
		const allUsernames = getAllUsernames();
		io.emit("user list", allUsernames);
		logger.debug(`Broadcasting list of all users [${allUsernames}]`);
	});

	// Handle disconnection
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
});

server.listen(PORT, () => {
	logger.info(`Server is running on port ${PORT} on v${SERVER_VERSION}`);
});
