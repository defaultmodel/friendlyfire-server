// logger.ts
import winston from 'winston';

// Create a logger instance
const myFormat = winston.format.printf(({ level, message, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
	level: "info", // modified by `setLogLevel`
	format: winston.format.combine(
		winston.format.timestamp(),
		myFormat
	),
	transports: [
		// Log to the console
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(), // Add colors to console output
				winston.format.simple(), // Simple readable format for console
			),
		}),
	],
});


// Function to update the logging level
export const setLogLevel = (level: string) => {
	logger.level = level;
};

export default logger;

