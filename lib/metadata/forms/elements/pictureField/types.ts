import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZPictureField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  border: ZBorder.optional(),
  borderColor: ZColor.optional(),
  enableDrag: z.boolean().optional(),
  enableStartDrag: z.boolean().optional(),
  fileDragMode: SE.ZFileDragMode.optional(),
  font: ZFont.optional(),
  height: z.number().optional(),
  horizontalStretch: z.boolean().optional(),
  hyperlink: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  nonselectedPictureText: z.string().optional(),
  pictureSize: SE.ZPictureSize.optional(),
  scale: z.number().optional(),
  textColor: ZColor.optional(),
  valuesPicture: ZPicture.optional(),
  verticalStretch: z.boolean().optional(),
  width: z.number().optional(),
  zoomable: z.boolean().optional(),
})

export const ZPictureFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Border: ZBorderXML.optional(),
  BorderColor: ZColorXML.optional(),
  EnableDrag: z.boolean().optional(),
  EnableStartDrag: z.boolean().optional(),
  FileDragMode: SE.ZFileDragMode.optional(),
  Font: ZFontXML.optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  Hyperlink: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  NonselectedPictureText: z.string().optional(),
  PictureSize: SE.ZPictureSize.optional(),
  Scale: z.number().optional(),
  TextColor: ZColorXML.optional(),
  ValuesPicture: ZPictureXML.optional(),
  VerticalStretch: z.boolean().optional(),
  Width: z.number().optional(),
  Zoomable: z.boolean().optional(),
})

export type TPictureField = z.infer<typeof ZPictureField>

export type TPictureFieldXML = z.infer<typeof ZPictureFieldXML>