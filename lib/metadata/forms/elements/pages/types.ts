import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import {  ZBaseElementXML } from "../baseElement/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZTable, ZTableXML } from "../table/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { TChildItems } from "../childItems/typesExt"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZEventsXML } from "~/lib/metadata/forms/events/types"

export const ZPages = ZFormGroup.extend({
  get associatedTable() {
    return ZTable.optional()
  },
  currentPagesState: SE.ZFormPagesState.optional(),
  currentRowUse: SE.ZCurrentRowUse.optional(),
  pagesRepresentation: SE.ZFormPagesRepresentation.optional(),
  userVisible: ZUserVisible.optional(),
  events: z.object({
    onCurrentPageChange: z.string().optional(),
  }).optional(),
})

export const ZPagesXML = z.object({
  _name: z.string(),
  _id: z.string(),
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
  Shortcut: z.string().optional(),
  Width: z.number().optional(),
  Height: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  PagesRepresentation: SE.ZFormPagesRepresentation.optional(),
  CurrentRowUse: SE.ZCurrentRowUse.optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  get AssociatedTable() {
    return ZTableXML.optional()
  },
  CurrentPagesState: SE.ZFormPagesState.optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  Type: SE.ZFormGroupType.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  get ChildItems() {
    return ZChildItemsXML.optional()
  },
  Events: ZEventsXML.optional(),
})

export type TPages = z.infer<typeof ZPages>

export type TPagesXML = z.infer<typeof ZPagesXML>