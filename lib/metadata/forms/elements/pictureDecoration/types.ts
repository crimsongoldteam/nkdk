import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZPicture, ZPictureXML } from "../../pictures/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/forms/border/types"

export const ZPictureDecoration = ZPictureDecoration.extend({
  hyperlink: z.boolean().optional(),
  picture: ZPicture.optional(),
  scale: z.number().optional(),
  zoomable: z.boolean().optional(),
  pictureSize: SE.ZPictureSize.optional(),
  enableStartDrag: z.boolean().optional(),
  enableDrag: z.boolean().optional(),
  border: ZBorder.optional(),
  fileDragMode: SE.ZFileDragMode.optional(),
  nonselectedPictureText: z.string().optional(),
  borderColor: ZColor.optional(),
})

export const ZPictureDecorationXML = ZPictureDecorationXML.extend({
  Hyperlink: z.boolean().optional(),
  Picture: ZPictureXML.optional(),
  Scale: z.number().optional(),
  Zoomable: z.boolean().optional(),
  PictureSize: SE.ZPictureSize.optional(),
  EnableStartDrag: z.boolean().optional(),
  EnableDrag: z.boolean().optional(),
  Border: ZBorderXML.optional(),
  FileDragMode: SE.ZFileDragMode.optional(),
  NonselectedPictureText: z.string().optional(),
  BorderColor: ZColorXML.optional(),
})

export type TPictureDecoration = z.infer<typeof ZPictureDecoration>

export type TPictureDecorationXML = z.infer<typeof ZPictureDecorationXML>