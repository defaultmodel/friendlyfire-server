// logger.ts
import winston from "winston";

const myFormat = winston.format.printf(({ level, message, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});

// Create a logger instance
const logger = winston.createLogger({
	level: "debug", // Set the minimum log level (e.g., 'info', 'warn', 'error', 'debug')
	format: winston.format.combine(winston.format.timestamp(), myFormat),
	transports: [
		// Log to the console
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(), // Add colors to console output
				winston.format.simple(), // Simple readable format for console
			),
		}),
		// Log to a file
		// new winston.transports.File({ filename: "logs/error.log", level: "error" }), // Log only errors to a file
		// new winston.transports.File({ filename: "logs/combined.log" }), // Log all levels to another file
	],
});

export default logger;
