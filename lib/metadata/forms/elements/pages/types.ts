import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import {  ZBaseElementXML } from "../baseElement/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZTable, ZTableXML } from "../table/types"
import { ZChildItems, ZChildItemsXML, TChildItems } from "../childItems/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZEventsXML } from "~/lib/metadata/forms/events/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { ZodChildItemsType } from "../childItems/typesExt"

export interface Pages {
  elementType: ElementType
  name: string
  id?: string
  enableContentChange?: boolean,
  enabled?: boolean,
  extendedTooltip?: FormDecoration,
  height?: number,
  horizontalAlignInGroup?: SE.ItemHorizontalLocation,
  horizontalStretch?: boolean,
  readOnly?: boolean,
  shortcut?: string,
  title?: I8nText,
  titleFont?: Font,
  titleTextColor?: Color,
  toolTip?: I8nText,
  toolTipRepresentation?: SE.ToolTipRepresentation,
  type?: SE.FormGroupType,
  userVisible?: UserVisible,
  verticalAlignInGroup?: SE.ItemVerticalAlign,
  verticalStretch?: boolean,
  visible?: boolean,
  width?: number,
  childItems?: ЭлементыФормы,
  associatedTable?: Table,
  currentPagesState?: SE.FormPagesState,
  currentRowUse?: SE.CurrentRowUse,
  pagesRepresentation?: SE.FormPagesRepresentation,
  events?: {
    onCurrentPageChange?: string,
  },
}

export interface PagesXML {
  _name: z.string(),
  _id: z.string(),
  Visible: boolean,
  UserVisible: UserVisible,
  Enabled: boolean,
  ReadOnly: boolean,
  EnableContentChange: boolean,
  Title: I8nText,
  TitleTextColor: Color,
  TitleFont: Font,
  ToolTip: I8nText,
  ToolTipRepresentation: SE.ToolTipRepresentation,
  Shortcut: string,
  Width: number,
  Height: number,
  HorizontalStretch: boolean,
  VerticalStretch: boolean,
  PagesRepresentation: SE.FormPagesRepresentation,
  CurrentRowUse: SE.CurrentRowUse,
  ExtendedTooltip: FormDecoration,
  AssociatedTable: Table,
  CurrentPagesState: SE.FormPagesState,
  HorizontalAlignInGroup: SE.ItemHorizontalLocation,
  Type: SE.FormGroupType,
  VerticalAlignInGroup: SE.ItemVerticalAlign,
  ChildItems: ЭлементыФормы,
}