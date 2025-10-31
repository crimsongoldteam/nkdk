import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZPictureField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  height: z.number().optional(),
  hyperlink: z.boolean().optional(),
  valuesPicture: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  scale: z.number().optional(),
  zoomable: z.boolean().optional(),
  pictureSize: SE.ZPictureSize.optional(),
  enableStartDrag: z.boolean().optional(),
  enableDrag: z.boolean().optional(),
  border: ZBorder.optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  fileDragMode: SE.ZFileDragMode.optional(),
  nonselectedPictureText: z.string().optional(),
  borderColor: ZColor.optional(),
  textColor: ZColor.optional(),
  width: z.number().optional(),
  font: ZFont.optional(),
})

export const ZPictureFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Height: z.number().optional(),
  Hyperlink: z.boolean().optional(),
  ValuesPicture: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  Scale: z.number().optional(),
  Zoomable: z.boolean().optional(),
  PictureSize: SE.ZPictureSize.optional(),
  EnableStartDrag: z.boolean().optional(),
  EnableDrag: z.boolean().optional(),
  Border: ZBorderXML.optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  FileDragMode: SE.ZFileDragMode.optional(),
  NonselectedPictureText: z.string().optional(),
  BorderColor: ZColorXML.optional(),
  TextColor: ZColorXML.optional(),
  Width: z.number().optional(),
  Font: ZFontXML.optional(),
})

export type TPictureField = z.infer<typeof ZPictureField>

export type TPictureFieldXML = z.infer<typeof ZPictureFieldXML>