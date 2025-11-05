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
  events: z.object({
    click: z.string().optional(),
    uRLProcessing: z.string().optional(),
  }).optional(),
})

export const ZLabelDecorationXML = ZFormDecorationXML.extend({
  Hyperlink: z.boolean().optional(),
  HorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  TitleHeight: z.number().optional(),
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  Border: ZBorderXML.optional(),
  Events: z.object({
    Click: z.string().optional(),
    URLProcessing: z.string().optional(),
  }).optional(),
})

export type TLabelDecoration = z.infer<typeof ZLabelDecoration>

export type TLabelDecorationXML = z.infer<typeof ZLabelDecorationXML>