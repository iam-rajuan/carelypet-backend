import { z } from "zod";

export const reportIdParamSchema = z.object({
  id: z.string().trim().min(1, "Report ID is required"),
});
