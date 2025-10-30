import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZTypeDescription, ZTypeDescriptionXML } from "~/lib/metadata/typeDescription/types"
import { ZPicture, ZPictureXML } from "../../pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/font/types"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"

export const ZPictureDecoration = ZPictureDecoration.extend({
  hyperlink: z.boolean().optional(),
  picture: ZPicture.optional(),
  scale: z.number().optional(),
  zoomable: z.boolean().optional(),
  pictureSize: SE.ZPictureSize.optional(),
  enableStartDrag: z.boolean().optional(),
  enableDrag: z.boolean().optional(),
  border: ZРамка.optional(),
  fileDragMode: SE.ZFileDragMode.optional(),
  nonselectedPictureText: z.string().optional(),
  borderColor: ZColor.optional(),
  value: z.string().optional(),
})

export const ZPictureDecorationXML = ZPictureDecorationXML.extend({
  Hyperlink: z.boolean().optional(),
  Picture: ZPictureXML.optional(),
  Scale: z.number().optional(),
  Zoomable: z.boolean().optional(),
  PictureSize: SE.ZPictureSize.optional(),
  EnableStartDrag: z.boolean().optional(),
  EnableDrag: z.boolean().optional(),
  Border: ZРамкаXML.optional(),
  FileDragMode: SE.ZFileDragMode.optional(),
  NonselectedPictureText: z.string().optional(),
  BorderColor: ZColorXML.optional(),
})

export type TPictureDecoration = z.infer<typeof ZPictureDecoration>

export type TPictureDecorationXML = z.infer<typeof ZPictureDecorationXML>