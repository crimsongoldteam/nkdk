import { z } from "zod"

export const ZI8nText = z.record(z.string(), z.string())
export type TI8nText = z.infer<typeof ZI8nText>

export const ZTypeDescription = z.object({
  type: z.array(z.string()),
  stringQualifiers: z
    .object({
      length: z.number(),
      allowedLength: z.enum(["Variable", "Fixed"]),
    })
    .optional(),
  numberQualifiers: z
    .object({
      digits: z.number(),
      fractionDigits: z.number(),
      allowedSign: z.enum(["Any", "Nonnegative"]).optional(),
    })
    .optional(),
  dateQualifiers: z
    .object({
      dateFractions: z.enum(["Date", "Time", "DateTime"]).optional(),
    })
    .optional(),
})
export type TTypeDescription = z.infer<typeof ZTypeDescription>
