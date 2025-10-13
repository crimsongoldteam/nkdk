import { z } from "zod"
import { ZStandardPicture, ZStandardPictureEnterprise } from "../../systemEnumerations/types"

export const ZPictureXML = z.object({
  "xr:Ref": z.string(),
  "xr:LoadTransparent": z.boolean(),
})

export const ZPicture = z.object({
  ref: z.union([z.string(), ZStandardPicture]),
  type: z.enum(["StandardPicture", "CommonPicture"]),
  loadTransparent: z.boolean(),
})

export const ZPictureEnterprise = z.union([z.string(), ZStandardPictureEnterprise])

export type TPictureXML = z.infer<typeof ZPictureXML>
export type TPicture = z.infer<typeof ZPicture>
