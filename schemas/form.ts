import { z } from "zod";

export const formschema = z.object({
  name: z.string().min(4),
  description: z.string().optional(),
  domain: z.string().min(1, { message: "Please select a domain" }),
  specialization: z.string().min(1, { message: "Please select a specialization" })
});

export type formschemaType = z.infer<typeof formschema>;