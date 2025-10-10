import { z } from "zod"

export const ZPictureXML = z.object({
  Ref: z.string(),
  LoadTransparent: z.boolean(),
})

export const ZPicture = z.object({
  ref: z.string(),
  loadTransparent: z.boolean(),
})
