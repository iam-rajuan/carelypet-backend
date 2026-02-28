import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_LARGE_MEDIA_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const allowedImages = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
const allowedVideos = ["video/mp4", "video/quicktime", "video/webm"];
const allowedDocuments = [...allowedImages, "application/pdf"];

const storage = multer.memoryStorage();

const createFileFilter =
  (allowed: string[], errorMessage: string) =>
  (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error(errorMessage));
  };

const createUploader = (allowed: string[], errorMessage: string, fileSize: number) =>
  multer({
    storage,
    limits: { fileSize },
    fileFilter: createFileFilter(allowed, errorMessage),
  });

const uploadImages = createUploader(
  allowedImages,
  "Only png, jpg, jpeg, and webp images are allowed",
  MAX_IMAGE_FILE_SIZE
);

const uploadDocs = createUploader(
  allowedDocuments,
  "Only pdf, png, jpg, jpeg, and webp files are allowed",
  MAX_IMAGE_FILE_SIZE
);

const uploadMessageMedia = createUploader(
  [...allowedImages, ...allowedVideos],
  "Only png, jpg, jpeg, webp, mp4, mov, and webm files are allowed",
  MAX_LARGE_MEDIA_FILE_SIZE
);

export const uploadSingleImage = uploadImages.single("file");
export const uploadMultipleImages = uploadImages.array("files", 5);
export const uploadPetCreateImages = uploadImages.array("files", 3);
export const uploadPetCreateMedia = uploadImages.fields([
  { name: "avatar", maxCount: 1 },
  { name: "files", maxCount: 3 },
]);
export const uploadDocument = uploadDocs.single("file");
export const uploadPetHealthFiles = uploadDocs.array("files", 3);
export const uploadPetHealthRecord = uploadDocs.any();
export const uploadMessageAttachments = uploadMessageMedia.array("files", 5);
export const uploadPostMedia = createUploader(
  [...allowedImages, ...allowedVideos],
  "Only png, jpg, jpeg, webp, mp4, mov, and webm files are allowed",
  MAX_LARGE_MEDIA_FILE_SIZE
).array("files", 5);
