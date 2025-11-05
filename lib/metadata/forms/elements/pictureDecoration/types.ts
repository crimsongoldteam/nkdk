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
  events: z.object({
    click: z.string().optional(),
    dragStart: z.string().optional(),
    dragEnd: z.string().optional(),
    drag: z.string().optional(),
    dragCheck: z.string().optional(),
  }).optional(),
})

export const ZPictureDecorationXML = ZFormDecorationXML.extend({
  Hyperlink: z.boolean().optional(),
  NonselectedPictureText: z.string().optional(),
  EnableStartDrag: z.boolean().optional(),
  EnableDrag: z.boolean().optional(),
  Picture: ZPictureXML.optional(),
  FileDragMode: SE.ZFileDragMode.optional(),
  Border: ZBorderXML.optional(),
  BorderColor: ZColorXML.optional(),
  PictureSize: SE.ZPictureSize.optional(),
  Scale: z.number().optional(),
  Zoomable: z.boolean().optional(),
  Events: z.object({
    Click: z.string().optional(),
    DragStart: z.string().optional(),
    DragEnd: z.string().optional(),
    Drag: z.string().optional(),
    DragCheck: z.string().optional(),
  }).optional(),
})

export type TPictureDecoration = z.infer<typeof ZPictureDecoration>

export type TPictureDecorationXML = z.infer<typeof ZPictureDecorationXML>