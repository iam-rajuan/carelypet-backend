import { Router, Request, Response, NextFunction } from "express";
import auth from "../../../middlewares/auth.middleware";
import validate from "../../../middlewares/validate.middleware";
import { createPetSchema, updatePetSchema, petIdParamSchema } from "./pets.validation";
import * as petsController from "./pets.controller";
import { ZodError, ZodSchema } from "zod";
import { uploadPetCreateMedia } from "../uploads/upload.middleware";

const router = Router();

const validateParams =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.params);
      req.params = parsed as typeof req.params;
      next();
    } catch (err) {
      const isZodError = err instanceof ZodError;
      return res.status(400).json({
        success: false,
        message: isZodError
          ? err.issues?.[0]?.message || "Validation failed"
          : "Validation failed",
        issues: isZodError ? err.issues : err,
      });
    }
  };

router.use(auth);

router.post("/", uploadPetCreateMedia, validate(createPetSchema), petsController.createPet);
router.get("/", petsController.getMyPets);
router.get("/:id", validateParams(petIdParamSchema), petsController.getPetById);
router.patch(
  "/:id",
  validateParams(petIdParamSchema),
  uploadPetCreateMedia,
  validate(updatePetSchema),
  petsController.updatePet
);
router.delete("/:id", validateParams(petIdParamSchema), petsController.deletePet);

export default router;
