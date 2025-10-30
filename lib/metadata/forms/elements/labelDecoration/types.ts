import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"

export const ZLabelDecoration = ZFormDecoration.extend({
  verticalAlign: SE.ZItemVerticalAlign.optional(),
  titleHeight: z.number().optional(),
  hyperlink: z.boolean().optional(),
  horizontalAlign: SE.ZItemHorizontalLocation.optional(),
  border: ZРамка.optional(),
  borderColor: ZColor.optional(),
  backColor: ZColor.optional(),
  value: z.string().optional(),
})

export const ZLabelDecorationXML = ZFormDecorationXML.extend({
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  TitleHeight: z.number().optional(),
  Hyperlink: z.boolean().optional(),
  HorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  Border: ZРамкаXML.optional(),
  BorderColor: ZColorXML.optional(),
  BackColor: ZColorXML.optional(),
})

export type TLabelDecoration = z.infer<typeof ZLabelDecoration>

export type TLabelDecorationXML = z.infer<typeof ZLabelDecorationXML>
