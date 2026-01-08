import { Request, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import * as petsService from "./pets.service";
import * as uploadsService from "../uploads/uploads.service";
import { toPetResponse } from "./pets.mapper";

const requireUser = (req: AuthRequest, res: Response): string | null => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  return req.user.id;
};

export const createPet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | Express.Multer.File[]
      | undefined;
    const photoFiles = Array.isArray(files)
      ? files
      : (files?.files as Express.Multer.File[] | undefined);
    const avatarFiles = Array.isArray(files)
      ? undefined
      : (files?.avatar as Express.Multer.File[] | undefined);

    if (!photoFiles || photoFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one pet photo is required",
      });
    }

    const photoUploads = await Promise.all(
      photoFiles.map((file) =>
        uploadsService.uploadFileToS3(file.buffer, file.mimetype, "pets/photos")
      )
    );
    const avatarUpload = avatarFiles?.[0]
      ? await uploadsService.uploadFileToS3(
          avatarFiles[0].buffer,
          avatarFiles[0].mimetype,
          "pets/avatars"
        )
      : undefined;

    const pet = await petsService.createPet(userId, {
      ...req.body,
      photos: photoUploads.map((item) => item.url),
      avatarUrl: avatarUpload?.url,
    });
    res.status(201).json({ success: true, data: toPetResponse(pet) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create pet";
    res.status(400).json({ success: false, message });
  }
};

export const getMyPets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const pets = await petsService.findPetsByOwner(userId);
    res.json({ success: true, data: pets.map(toPetResponse) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch pets";
    res.status(400).json({ success: false, message });
  }
};

export const getPetById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const pet = await petsService.findPetById(userId, req.params.id);
    res.json({ success: true, data: toPetResponse(pet) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pet not found";
    const status = message === "Pet not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const updatePet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | Express.Multer.File[]
      | undefined;
    const photoFiles = Array.isArray(files)
      ? files
      : (files?.files as Express.Multer.File[] | undefined);
    const avatarFiles = Array.isArray(files)
      ? undefined
      : (files?.avatar as Express.Multer.File[] | undefined);

    const hasNewPhotos = Array.isArray(photoFiles) && photoFiles.length > 0;
    const hasNewAvatar = Array.isArray(avatarFiles) && avatarFiles.length > 0;
    const keepPhotos = req.body.keepPhotos as string[] | undefined;
    const deletePhotos = req.body.deletePhotos as string[] | undefined;
    const hasKeepPhotos = Array.isArray(keepPhotos) && keepPhotos.length > 0;
    const hasDeletePhotos = Array.isArray(deletePhotos) && deletePhotos.length > 0;
    const hasPhotoListMutation = hasKeepPhotos || hasDeletePhotos;

    if (hasNewPhotos || hasNewAvatar || hasPhotoListMutation) {
      const existingPet = await petsService.findPetById(userId, req.params.id);
      const uploadedPhotos = hasNewPhotos
        ? await Promise.all(
            photoFiles.map((file) =>
              uploadsService.uploadFileToS3(file.buffer, file.mimetype, "pets/photos")
            )
          )
        : [];
      const uploadedAvatar = hasNewAvatar
        ? await uploadsService.uploadFileToS3(
            avatarFiles[0].buffer,
            avatarFiles[0].mimetype,
            "pets/avatars"
          )
        : undefined;

      const matchesPhoto = (photo: string, target: string) =>
        photo === target || photo.endsWith(target);
      const uploadedPhotoUrls = uploadedPhotos.map((item) => item.url);
      const currentPhotos = existingPet.photos || [];
      const shouldReplaceAllPhotos = hasNewPhotos && !hasPhotoListMutation;
      let nextPhotos = shouldReplaceAllPhotos ? [] : currentPhotos.slice();

      if (hasKeepPhotos) {
        nextPhotos = nextPhotos.filter((photo) =>
          keepPhotos.some((keep) => matchesPhoto(photo, keep))
        );
      }
      if (hasDeletePhotos) {
        nextPhotos = nextPhotos.filter(
          (photo) => !deletePhotos.some((remove) => matchesPhoto(photo, remove))
        );
      }
      if (hasNewPhotos) {
        nextPhotos = shouldReplaceAllPhotos
          ? uploadedPhotoUrls
          : [...nextPhotos, ...uploadedPhotoUrls];
      }

      const previousAvatar = hasNewAvatar ? existingPet.avatarUrl : undefined;

      try {
        const removedPhotos = currentPhotos.filter(
          (photo) => !nextPhotos.some((next) => matchesPhoto(photo, next))
        );
        if (removedPhotos.length > 0) {
          await Promise.all(
            removedPhotos
              .filter((photo) => photo.includes(".amazonaws.com/"))
              .map((photo) =>
                uploadsService.deleteFileFromS3(uploadsService.extractKeyFromUrl(photo))
              )
          );
        }
        if (previousAvatar && previousAvatar.includes(".amazonaws.com/")) {
          await uploadsService.deleteFileFromS3(uploadsService.extractKeyFromUrl(previousAvatar));
        }
      } catch (err) {
        await Promise.all(
          uploadedPhotos.map((item) =>
            uploadsService.deleteFileFromS3(item.key).catch(() => undefined)
          )
        );
        if (uploadedAvatar) {
          await uploadsService.deleteFileFromS3(uploadedAvatar.key).catch(() => undefined);
        }
        throw err;
      }

      if (hasNewPhotos || hasPhotoListMutation) req.body.photos = nextPhotos;
      if (hasNewAvatar) req.body.avatarUrl = uploadedAvatar?.url;
    }

    const pet = await petsService.updatePet(userId, req.params.id, req.body);
    res.json({ success: true, data: toPetResponse(pet), message: "Pet updated" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update pet";
    const status = message === "Pet not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const deletePet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    await petsService.deletePet(userId, req.params.id);
    res.json({ success: true, message: "Pet deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete pet";
    const status = message === "Pet not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};
