import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"

export const ZLabelDecoration = ZFormDecoration.extend({
  backColor: ZColor.optional(),
  border: ZBorder.optional(),
  borderColor: ZColor.optional(),
  horizontalAlign: SE.ZItemHorizontalLocation.optional(),
  hyperlink: z.boolean().optional(),
  titleHeight: z.number().optional(),
  verticalAlign: SE.ZItemVerticalAlign.optional(),
})

export const ZLabelDecorationXML = ZFormDecorationXML.extend({
  BackColor: ZColorXML.optional(),
  Border: ZBorderXML.optional(),
  BorderColor: ZColorXML.optional(),
  HorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  Hyperlink: z.boolean().optional(),
  TitleHeight: z.number().optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
})

export type TLabelDecoration = z.infer<typeof ZLabelDecoration>

export type TLabelDecorationXML = z.infer<typeof ZLabelDecorationXML>