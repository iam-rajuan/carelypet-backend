import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const allowedImages = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
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

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "photos") {
      return createFileFilter(
        allowedImages,
        "Only png, jpg, jpeg, and webp images are allowed"
      )(req, file, cb);
    }
    if (file.fieldname === "healthFiles" || file.fieldname === "files") {
      return createFileFilter(
        allowedDocuments,
        "Only pdf, png, jpg, jpeg, and webp files are allowed"
      )(req, file, cb);
    }
    return cb(new Error("Unexpected file field"));
  },
});

export const uploadAdoptionMedia = upload.fields([
  { name: "photos", maxCount: 3 },
  { name: "healthFiles", maxCount: 21 },
]);

export const uploadHealthRecordFiles = upload.fields([{ name: "files", maxCount: 3 }]);
