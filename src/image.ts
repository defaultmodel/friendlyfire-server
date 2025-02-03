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

const router = express.Router();

// Function to ensure the uploads directory exists
const ensureUploadsDirExists = (dir: string) => {
	if (!existsSync(dir)) {
		logger.warn(`Uploads directory does not exist. Creating: ${dir}`);
		mkdirSync(dir, { recursive: true }); // Create the directory recursively
	}
};

// Configure multer for file uploads
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

const upload = multer({
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

// POST route for image upload
router.post("/upload", upload.single("image"), async (req, res) => {
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
		// Transcode the image to AVIF format using sharp
		await sharp(inputFilePath)
			.avif({ quality: 50, effort: 2 }) // Adjust quality as needed
			.toFile(outputFilePath);

		// Remove the original file after transcoding
		unlinkSync(inputFilePath);

		const imageUrl = `/uploads/images/${path.basename(outputFilePath)}`; // Construct the image URL
		logger.info(`Image uploaded and transcoded successfully: ${imageUrl}`);

		// Broadcast the image URL to all connected clients
		const io = getIo();
		io.emit("new image", imageUrl);

		res.status(200).json({ imageUrl });
	} catch (error: any) {
		logger.error(`Error transcoding image: ${error.message}`);
		res.status(500).json({ error: "Error transcoding image" });
	}
});

export default router;
