import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"

export const ZPictureDecoration = ZFormDecoration.extend({
  border: ZBorder.optional(),
  borderColor: ZColor.optional(),
  enableDrag: z.boolean().optional(),
  enableStartDrag: z.boolean().optional(),
  fileDragMode: SE.ZFileDragMode.optional(),
  hyperlink: z.boolean().optional(),
  nonselectedPictureText: z.string().optional(),
  picture: ZPicture.optional(),
  pictureSize: SE.ZPictureSize.optional(),
  scale: z.number().optional(),
  zoomable: z.boolean().optional(),
})

export const ZPictureDecorationXML = ZFormDecorationXML.extend({
  Border: ZBorderXML.optional(),
  BorderColor: ZColorXML.optional(),
  EnableDrag: z.boolean().optional(),
  EnableStartDrag: z.boolean().optional(),
  FileDragMode: SE.ZFileDragMode.optional(),
  Hyperlink: z.boolean().optional(),
  NonselectedPictureText: z.string().optional(),
  Picture: ZPictureXML.optional(),
  PictureSize: SE.ZPictureSize.optional(),
  Scale: z.number().optional(),
  Zoomable: z.boolean().optional(),
})

export type TPictureDecoration = z.infer<typeof ZPictureDecoration>

export type TPictureDecorationXML = z.infer<typeof ZPictureDecorationXML>