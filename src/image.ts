// image.ts
import express from "express";
import multer from "multer";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { getIo } from "./socketManager.js";
import logger from "./logger.js";
import { cwd } from "node:process";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import sharp from "sharp";
import type { Server } from "socket.io";

const router = express.Router();
const mediaQueue: string[] = [];
let queueProcessing = false;
const DISPLAY_TIME = 5000; // TODO: should be a new-image argument later-on

// Function to ensure the uploads directory exists
function ensureUploadsDirExists(dir: string): void {
	if (!existsSync(dir)) {
		logger.warn(`Uploads directory does not exist. Creating: ${dir}`);
		mkdirSync(dir, { recursive: true }); // Create the directory recursively
	}
}

// Configure multer for file uploads
function configureMulter() {
	const storage = multer.diskStorage({
		destination: (_req, _file, cb) => {
			const uploadDir = path.join(cwd(), "uploads", "images");
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

const upload = configureMulter();

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

	while (mediaQueue.length > 0) {
		const imageUrl = mediaQueue.shift();
		if (imageUrl) {
			const io = getIo();
			io.emit("new image", imageUrl);
			logger.info(`Sending image: ${imageUrl}`);
			await new Promise((resolve) => setTimeout(resolve, DISPLAY_TIME));
		}
	}

	queueProcessing = false;
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

	try {
		// Transcode the image to AVIF format
		await transcodeImage(inputFilePath, outputFilePath);
		logger.debug(`Image transcoded successfully: ${inputFilePath}`);

		// Remove the original file after transcoding
		unlinkSync(inputFilePath);

		const imageUrl = `/uploads/images/${path.basename(outputFilePath)}`; // Construct the image URL

		mediaQueue.push(imageUrl);
		processQueue();
		logger.debug(`Image added to queue: ${imageUrl}`);

		logger.info(`Image uploaded and transcoded successfully: ${imageUrl}`);

		res.status(200).json({ imageUrl });
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (error: any) {
		logger.error(`Error processing image: ${error.message}`);
		res.status(500).json({ error: "Image processing failed" });
	}
}

// POST route for image upload
router.post("/upload", upload.single("image"), async (req, res) => {
	await handleImageUpload(req, res);
});

export default router;
