import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import {  ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { TChildItems } from "../childItems/typesExt"
import { ZFormItemAddition, ZFormItemAdditionXML } from "../formItemAddition/types"

export const ZSearchStringAddition = ZFormItemAddition.extend({
  backColor: ZColor.optional(),
  borderColor: ZColor.optional(),
  font: ZFont.optional(),
  horizontalStretch: z.boolean().optional(),
  textColor: ZColor.optional(),
  width: z.number().optional(),
})

export const ZSearchStringAdditionXML = z.object({
  _id: z.string(),
  _name: z.string(),
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  Enabled: z.boolean().optional(),
  get ContextMenu() {
    return ZFormGroupXML.optional()
  },
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  get ExtendedToolTip() {
    return ZFormDecorationXML.optional()
  },
  Font: ZFontXML.optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  HorizontalStretch: z.boolean().optional(),
  TextColor: ZColorXML.optional(),
  Title: ZI8nTextXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Type: SE.ZFormItemAdditionType.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  Visible: z.boolean().optional(),
  Width: z.number().optional(),
  get ChildItems() {
    return ZChildItemsXML.optional()
  },
})

export type TSearchStringAddition = z.infer<typeof ZSearchStringAddition>

export type TSearchStringAdditionXML = z.infer<typeof ZSearchStringAdditionXML>