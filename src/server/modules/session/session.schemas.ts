import { z } from "zod";

export const sessionSchema = z
  .object({
    sessionId: z.string().meta({ examples: ["sess_2abc"] }),
    userId: z.string().meta({ examples: ["user_2abc"] }),
  })
  .meta({ id: "Session" });

export type Session = z.infer<typeof sessionSchema>;
