import * as z from "zod"
import { ZNamedElement } from "../element/types"
import { ZPicture, ZPictureXML } from "../../pictures/types"

export const ZPictureDecorationXML = z.object({
  PictureDecoration: z.object({
    _id: z.string(),
    _name: z.string(),
    Picture: ZPictureXML.optional(),
  }),
})

export const ZPictureDecoration = ZNamedElement.extend({
  picture: ZPicture.optional(),
})

export type TPictureDecoration = z.infer<typeof ZPictureDecoration>
export type TPictureDecorationXML = z.infer<typeof ZPictureDecorationXML>
