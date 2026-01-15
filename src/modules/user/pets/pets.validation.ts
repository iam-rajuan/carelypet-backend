import { z } from "zod";

const petTypeSchema = z.string().trim().min(2, "Pet type is required");
const bioSchema = z.string().trim().max(1000, "About must be at most 1000 characters");
const photoUrlSchema = z.string().trim().url("Invalid photo URL");
const avatarUrlSchema = z.string().trim().url("Invalid avatar URL");
const yesNoBooleanSchema = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === "boolean") return val;
    const normalized = val.trim().toLowerCase();
    return normalized === "true" || normalized === "yes";
  });
const nonNegativeNumber = (message: string) =>
  z.preprocess((value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  }, z.number().min(0, message));

const numberSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
}, z.number());
const stringArraySchema = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through to comma-separated parsing
    }
    return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return value;
}, z.array(z.string().trim().min(1)));
const personalitySchema = z.preprocess((value) => {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through to comma-separated parsing
    }
    return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return value;
}, z.array(z.string().trim().min(1)).max(5, "Max 5 personality traits"));

const healthRecordTypeSchema = z.enum([
  "vaccination",
  "checkup",
  "medication",
  "tick_flea",
  "surgery",
  "dental",
  "other",
]);

type HealthRecordType = z.infer<typeof healthRecordTypeSchema>;

const jsonSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }, schema);

const recordDetailsSchema = z.object({
  recordName: z.string().trim().min(1, "Record name is required"),
  batchLotNo: z.string().trim().optional(),
  otherInfo: z.string().trim().optional(),
  cost: z.string().trim().optional(),
  date: z.string().trim().optional(),
  nextDueDate: z.string().trim().optional(),
  reminder: z
    .object({
      enabled: z.boolean(),
      offset: z.string().trim().optional(),
    })
    .optional(),
});

const veterinarianSchema = z.object({
  designation: z.string().trim().optional(),
  name: z.string().trim().optional(),
  clinicName: z.string().trim().optional(),
  licenseNo: z.string().trim().optional(),
  contact: z.string().trim().optional(),
});

const vitalSignsSchema = z.object({
  weight: z.string().trim().optional(),
  temperature: z.string().trim().optional(),
  heartRate: z.string().trim().optional(),
  respiratory: z.string().trim().optional(),
  status: z.enum(["normal", "high", "low"]).optional(),
});

const observationSchema = z.object({
  lookupObservations: z.array(z.string().trim().min(1)).optional(),
  clinicalNotes: z.string().trim().optional(),
});

const baseHealthRecordSchema = {
  recordDetails: jsonSchema(recordDetailsSchema),
  veterinarian: jsonSchema(veterinarianSchema),
  vitalSigns: jsonSchema(vitalSignsSchema),
  observation: jsonSchema(observationSchema),
};

const requireFullHealthRecord = (
  value: {
    recordDetails?: z.infer<typeof recordDetailsSchema>;
    veterinarian?: z.infer<typeof veterinarianSchema>;
    vitalSigns?: z.infer<typeof vitalSignsSchema>;
    observation?: z.infer<typeof observationSchema>;
  },
  ctx: z.RefinementCtx
) => {
  const details = (value.recordDetails || {}) as z.infer<typeof recordDetailsSchema>;
  const vet = (value.veterinarian || {}) as z.infer<typeof veterinarianSchema>;
  const vitals = (value.vitalSigns || {}) as z.infer<typeof vitalSignsSchema>;
  const obs = (value.observation || {}) as z.infer<typeof observationSchema>;
  const reminder = details.reminder as { enabled?: boolean; offset?: string } | undefined;

  const requireText = (field: string, message: string) => {
    if (!field.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  };

  requireText(details.batchLotNo || "", "Batch/Lot No. is required");
  requireText(details.otherInfo || "", "Other info is required");
  requireText(details.cost || "", "Cost is required");
  requireText(details.date || "", "Date is required");
  requireText(details.nextDueDate || "", "Next due date is required");

  if (details.reminder === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Reminder is required" });
  } else if (reminder?.enabled && !reminder.offset?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Reminder offset is required" });
  }

  requireText(vet.designation || "", "Designation is required");
  requireText(vet.name || "", "Veterinarian name is required");
  requireText(vet.clinicName || "", "Clinic name is required");
  requireText(vet.licenseNo || "", "License no. is required");
  requireText(vet.contact || "", "Contact is required");

  requireText(vitals.weight || "", "Weight is required");
  requireText(vitals.temperature || "", "Temperature is required");
  requireText(vitals.heartRate || "", "Heart rate is required");
  requireText(vitals.respiratory || "", "Respiratory rate is required");
  if (!vitals.status) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vital status is required" });
  }

  const observations = obs.lookupObservations || [];
  if (!Array.isArray(observations) || observations.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Observation is required" });
  }
  requireText(obs.clinicalNotes || "", "Clinical notes are required");
};

const createTypedHealthRecordSchema = (type: HealthRecordType, requireFull: boolean) =>
  z
    .object({
      type: z.literal(type).optional().default(type),
      ...baseHealthRecordSchema,
    })
    .superRefine((value, ctx) => {
      if (!requireFull) return;
      requireFullHealthRecord(value, ctx);
    });

export const createPetSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  type: petTypeSchema.optional(),
  species: petTypeSchema.optional(),
  breed: z.string().trim().optional(),
  age: nonNegativeNumber("Age must be zero or positive").optional(),
  weightLbs: nonNegativeNumber("Weight must be zero or positive").optional(),
  gender: z.enum(["male", "female"]).optional(),
  trained: yesNoBooleanSchema.optional(),
  vaccinated: yesNoBooleanSchema.optional(),
  neutered: yesNoBooleanSchema.optional(),
  personality: personalitySchema.optional(),
  about: bioSchema.optional(),
  bio: bioSchema.optional(),
  photos: z.array(photoUrlSchema).optional(),
  avatarUrl: avatarUrlSchema.optional(),
}).superRefine((value, ctx) => {
  if (!value.species && !value.type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pet type is required",
      path: ["type"],
    });
  }
});

export const updatePetSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  type: petTypeSchema.optional(),
  species: petTypeSchema.optional(),
  breed: z.string().trim().optional(),
  age: nonNegativeNumber("Age must be zero or positive").optional(),
  weightLbs: nonNegativeNumber("Weight must be zero or positive").optional(),
  gender: z.enum(["male", "female"]).optional(),
  trained: yesNoBooleanSchema.optional(),
  vaccinated: yesNoBooleanSchema.optional(),
  neutered: yesNoBooleanSchema.optional(),
  personality: personalitySchema.optional(),
  about: bioSchema.optional(),
  bio: bioSchema.optional(),
  photos: z.array(photoUrlSchema).optional(),
  avatarUrl: avatarUrlSchema.optional(),
  keepPhotos: stringArraySchema.optional(),
  deletePhotos: stringArraySchema.optional(),
});

export const petIdParamSchema = z.object({
  id: z.string().trim().min(1, "Pet id is required"),
});

export const petHealthRecordParamSchema = z.object({
  id: z.string().trim().min(1, "Pet id is required"),
  recordId: z.string().trim().min(1, "Record id is required"),
});

export const createHealthRecordSchema = z
  .object({
    type: healthRecordTypeSchema,
    ...baseHealthRecordSchema,
  })
  .superRefine((value, ctx) => {
    if (value.type !== "vaccination" && value.type !== "checkup") return;
    requireFullHealthRecord(value, ctx);
  });

export const healthRecordListQuerySchema = z.object({
  type: healthRecordTypeSchema.optional(),
});

export const createVaccinationHealthRecordSchema = createTypedHealthRecordSchema(
  "vaccination",
  true
);
export const createCheckupHealthRecordSchema = createTypedHealthRecordSchema("checkup", true);
export const createMedicationHealthRecordSchema = createTypedHealthRecordSchema(
  "medication",
  false
);
export const createTickFleaHealthRecordSchema = createTypedHealthRecordSchema(
  "tick_flea",
  false
);
export const createSurgeryHealthRecordSchema = createTypedHealthRecordSchema("surgery", false);
export const createDentalHealthRecordSchema = createTypedHealthRecordSchema("dental", false);
export const createOtherHealthRecordSchema = createTypedHealthRecordSchema("other", false);

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
export type PetIdParam = z.infer<typeof petIdParamSchema>;
export type PetHealthRecordParam = z.infer<typeof petHealthRecordParamSchema>;
export type CreateHealthRecordInput = z.infer<typeof createHealthRecordSchema>;
export type HealthRecordListQuery = z.infer<typeof healthRecordListQuerySchema>;
