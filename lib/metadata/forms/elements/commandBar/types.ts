import * as z from "zod"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import {
  ZI8nText,
  ZI8nTextXML,
} from "~/lib/metadata/commonObjects/i8nText/types"
import {
  ZUserVisible,
  ZUserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { ZodChildItemsType } from "../childItems/typesExt"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"

export const ZCommandBar = z.object({
  elementType: ZElementType,
  name: z.string(),
  id: z.string().optional(),
  enableContentChange: z.boolean().optional(),
  enabled: z.boolean().optional(),
  get extendedTooltip() {
    return ZFormDecoration.optional()
  },
  height: z.number().optional(),
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  horizontalStretch: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  shortcut: z.string().optional(),
  title: ZI8nText.optional(),
  titleFont: ZFont.optional(),
  titleTextColor: ZColor.optional(),
  toolTip: ZI8nText.optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  type: SE.ZFormGroupType.optional(),
  userVisible: ZUserVisible.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  verticalStretch: z.boolean().optional(),
  visible: z.boolean().optional(),
  width: z.number().optional(),
  get childItems(): ZodChildItemsType {
    return ZChildItems
  },
  autofill: z.boolean().optional(),
  displayImportance: SE.ZDisplayImportance.optional(),
  horizontalAlign: SE.ZItemHorizontalLocation.optional(),
})

export const ZCommandBarXML = z.object({
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  HorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  Visible: z.boolean().optional(),
  UserVisible: ZUserVisibleXML.optional(),
  Enabled: z.boolean().optional(),
  ReadOnly: z.boolean().optional(),
  EnableContentChange: z.boolean().optional(),
  Title: ZI8nTextXML.optional(),
  TitleTextColor: ZColorXML.optional(),
  TitleFont: ZFontXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Width: z.number().optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  Autofill: z.boolean().optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  Shortcut: z.string().optional(),
  Type: SE.ZFormGroupType.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  get ChildItems() {
    return ZChildItemsXML.optional()
  },
})

export type TCommandBar = z.infer<typeof ZCommandBar>

export type TCommandBarXML = z.infer<typeof ZCommandBarXML>
