// logger.ts
import winston from 'winston';

// Create a logger instance
const myFormat = winston.format.printf(({ level, message, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});

const jsonFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.json() // Log in JSON format
);

const prettyFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.prettyPrint() // JSON pretty-print the logs
);

const plainFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.colorize(), // Add colors to console output
	winston.format.printf(({ level, message, timestamp }) => {
		return `${timestamp} ${level}: ${message}`; // Plain text format
	})
);

// Create a default logger tthat will be modified via the function below in index.ts
const logger = winston.createLogger({
    level: "info", // Default log level, modified by `setLogLevel`
    format: prettyFormat, // Default format, modified by `setLogFormat`
    transports: [
        // Log to the console
        new winston.transports.Console(),
    ],
});

// Function to update the logging level
export const setLogLevel = (level: string) => {
	logger.level = level;
};

// Function to update the log format
export const setLogFormat = (format: string) => {
	switch (format) {
		case 'json':
			logger.format = jsonFormat;
			break;
		case 'pretty':
			logger.format = prettyFormat;
			break;
		case 'plain':
		default:
			logger.format = plainFormat;
			break;
	}
};

export default logger;

