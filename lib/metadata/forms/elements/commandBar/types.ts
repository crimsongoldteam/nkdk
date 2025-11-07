import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZFormGroup } from "../formGroup/types"
import { ZFormDecorationXML } from "../formDecoration/types"
import { ZChildItemsXML } from "../childItems/types"
import {
  ZUserVisible,
  ZUserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"

export const ZCommandBar = ZFormGroup.extend({
  autoFill: z.boolean().optional(),
  displayImportance: SE.ZDisplayImportance.optional(),
  horizontalAlign: SE.ZItemHorizontalLocation.optional(),
  userVisible: ZUserVisible.optional(),
})

export const ZCommandBarXML = z.object({
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  AutoFill: z.boolean().optional(),
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
  HorizontalAlign: SE.ZItemHorizontalLocation.optional(),
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
