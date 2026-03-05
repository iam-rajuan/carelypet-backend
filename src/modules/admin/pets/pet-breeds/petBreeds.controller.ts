import { Request, Response } from "express";
import * as petBreedsService from "./petBreeds.service";

export const createPetBreed = async (req: Request, res: Response) => {
  try {
    const breed = await petBreedsService.createPetBreed(req.params.typeId, req.body.name);
    res.status(201).json({ success: true, data: breed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create pet breed";
    const status = message === "Pet type not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const listBreedsByType = async (req: Request, res: Response) => {
  try {
    const breeds = await petBreedsService.listBreedsByType(req.params.typeId);
    res.json({ success: true, data: breeds });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch pet breeds";
    const status = message === "Pet type not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const updatePetBreed = async (req: Request, res: Response) => {
  try {
    const breed = await petBreedsService.updatePetBreed(req.params.id, req.body.name);
    res.json({ success: true, message: "Pet breed updated", data: breed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update pet breed";
    const status = message === "Pet breed not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const deletePetBreed = async (req: Request, res: Response) => {
  try {
    await petBreedsService.deletePetBreed(req.params.id);
    res.json({ success: true, message: "Pet breed deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete pet breed";
    const status = message === "Pet breed not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};
