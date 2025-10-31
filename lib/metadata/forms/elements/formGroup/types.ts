import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"

export const ZFormGroup = ZBaseElement.extend({
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  type: SE.ZFormGroupType.optional(),
  visible: z.boolean().optional(),
  height: z.number().optional(),
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  enabled: z.boolean().optional(),
  title: ZI8nText.optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  toolTip: ZI8nText.optional(),
  childItems: ZChildItems,
  enableContentChange: z.boolean().optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  get extendedTooltip() {
    return ZFormDecoration.optional()
  },
  shortcut: z.string().optional(),
  readOnly: z.boolean().optional(),
  titleTextColor: ZColor.optional(),
  width: z.number().optional(),
  titleFont: ZFont.optional(),
})

export const ZFormGroupXML = ZBaseElementXML.extend({
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  Type: SE.ZFormGroupType.optional(),
  Visible: z.boolean().optional(),
  Height: z.number().optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  Enabled: z.boolean().optional(),
  Title: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ChildItems: ZChildItemsXML,
  EnableContentChange: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  Shortcut: z.string().optional(),
  ReadOnly: z.boolean().optional(),
  TitleTextColor: ZColorXML.optional(),
  Width: z.number().optional(),
  TitleFont: ZFontXML.optional(),
})

export type TFormGroup = z.infer<typeof ZFormGroup>

export type TFormGroupXML = z.infer<typeof ZFormGroupXML>