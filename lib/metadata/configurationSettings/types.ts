import { z } from "zod"

export const ZConfigurationSettings = z.object({
  defaultLanguage: z.string(),
})

export type TConfigurationSettings = z.infer<typeof ZConfigurationSettings>
