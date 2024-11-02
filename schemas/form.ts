import { z } from "zod";

export const formschema = z.object({
  name: z.string().min(4),
  description: z.string().optional(),
});

export type formschemaType = z.infer<typeof formschema>;
