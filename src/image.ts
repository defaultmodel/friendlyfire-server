// image.ts
import express from "express";
import multer from "multer";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { getIo } from "./socketManager.js";
import logger from "./logger.js";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import sharp from "sharp";

type Media = {
	url: string;
	displayTime: number;
};

const mediaQueue: Media[] = [];
let queueProcessing = false;

// Function to ensure the uploads directory exists
function ensureUploadsDirExists(dir: string): void {
	if (!existsSync(dir)) {
		logger.warn(`Uploads directory does not exist. Creating: ${dir}`);
		mkdirSync(dir, { recursive: true }); // Create the directory recursively
	}
}

// Configure multer for file uploads
function configureMulter(uploadsDir: string) {
	const storage = multer.diskStorage({
		destination: (_req, _file, cb) => {
			const uploadDir = path.join(uploadsDir, "images");
			ensureUploadsDirExists(uploadDir); // Ensure the directory exists
			cb(null, uploadDir);
		},
		filename: (_req, file, cb) => {
			const ext = path.extname(file.originalname); // Get the file extension
			const randomName = uuidv4() + ext; // Generate a random name with the same extension
			cb(null, randomName);
		},
	});

	return multer({
		storage,
		fileFilter: (_req, file, cb) => {
			// Accept only image files
			if (file.mimetype.startsWith("image/")) {
				cb(null, true);
			} else {
				cb(new Error("Only image files are allowed!"));
			}
		},
	});
}

// Transcode image to AVIF format
async function transcodeImage(
	inputFilePath: string,
	outputFilePath: string,
): Promise<void> {
	await sharp(inputFilePath)
		.avif({ quality: 50, effort: 2 }) // Adjust quality as needed
		.toFile(outputFilePath);
}

async function processQueue() {
	if (queueProcessing) return;
	queueProcessing = true;

	try {
		while (mediaQueue.length > 0) {
			const media = mediaQueue.shift();
			if (media) {
				const { url, displayTime } = media;
				const io = getIo();
				io.emit("new image", url, displayTime);
				logger.info(`Sending image: ${url}`);
				await new Promise((resolve) => setTimeout(resolve, displayTime));
			}
		}
	} catch (error) {
		if (typeof error === "string") {
			logger.error(`Error processing image in queue: ${error}`);
		} else if (error instanceof Error) {
			logger.error(`Error processing image in queue: ${error.message}`);
		}
	} finally {
		queueProcessing = false;
	}
}

// Handle image upload
async function handleImageUpload(
	req: express.Request,
	res: express.Response,
): Promise<void> {
	if (!req.file) {
		logger.warn("No file uploaded");
		res.status(400).json({ error: "No file uploaded" });
		return;
	}

	const inputFilePath = req.file.path;
	const outputFilePath = path.join(
		path.dirname(inputFilePath),
		`${path.basename(inputFilePath, path.extname(inputFilePath))}.avif`,
	);

	const displayTime = Number.parseInt(req.body.displayTime, 10);
	if (Number.isNaN(displayTime)) {
		logger.warn(
			`display time sent by ${req.ip} is not a number: ${displayTime}`,
		);
		res.status(400).json({
			error: `the display time you sent was not a number ${displayTime}`,
		});
		return;
	}

	try {
		// Transcode the image to AVIF format
		await transcodeImage(inputFilePath, outputFilePath);
		logger.debug(`Image transcoded successfully: ${inputFilePath}`);

		// Remove the original file after transcoding
		unlinkSync(inputFilePath);

		const media: Media = {
			url: `/uploads/images/${path.basename(outputFilePath)}`,
			displayTime: displayTime,
		};
		mediaQueue.push(media);
		processQueue();
		logger.debug(
			`Image added to queue: ${`/uploads/images/${path.basename(outputFilePath)}`}`,
		);

		res
			.status(200)
			.json({ imageUrl: `/uploads/images/${path.basename(outputFilePath)}` });
		logger.info(
			`Image uploaded and transcoded successfully: ${`/uploads/images/${path.basename(outputFilePath)}`}`,
		);
	} catch (error) {
		unlinkSync(inputFilePath); // Attempt to delete the original file
		if (typeof error === "string") {
			logger.error(`Error handling upload: ${error}`);
			res.status(500).json({ error: `Error handling upload: ${error}` });
		} else if (error instanceof Error) {
			logger.error(`Error handling upload: ${error.message}`);
			res.status(500).json({ error: `Error handling upload: ${error}` });
		}
		return;
	}
}

// Create and configure the image router
export default function createImageRouter(uploadDir: string) {
	const router = express.Router();
	const upload = configureMulter(uploadDir);
	// POST route for image upload
	router.post("/upload", upload.single("image"), async (req, res) => {
		await handleImageUpload(req, res);
	});

	return router;
}
