import { z } from "zod";

export const petBreedIdParamSchema = z.object({
  id: z.string().trim().min(1, "Pet breed id is required"),
});

export const petTypeIdParamSchema = z.object({
  typeId: z.string().trim().min(1, "Pet type id is required"),
});

export const createPetBreedSchema = z.object({
  name: z.string().trim().min(2, "Pet breed name is required").max(50, "Max 50 characters"),
});

export const updatePetBreedSchema = z.object({
  name: z.string().trim().min(2, "Pet breed name is required").max(50, "Max 50 characters"),
});

export type CreatePetBreedInput = z.infer<typeof createPetBreedSchema>;
export type UpdatePetBreedInput = z.infer<typeof updatePetBreedSchema>;
export type PetBreedIdParam = z.infer<typeof petBreedIdParamSchema>;
export type PetTypeIdParam = z.infer<typeof petTypeIdParamSchema>;
