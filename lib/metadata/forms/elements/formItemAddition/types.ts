import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZChildItems, ZChildItemsXML, TChildItems } from "../childItems/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { ZodChildItemsType } from "../childItems/typesExt"

export interface FormItemAddition {
  elementType: ElementType
  name: string
  id?: string
  contextMenu?: CommandBar,
  displayImportance?: SE.DisplayImportance,
  enabled?: boolean,
  extendedToolTip?: FormDecoration,
  horizontalAlignInGroup?: SE.ItemHorizontalLocation,
  title?: I8nText,
  toolTip?: I8nText,
  toolTipRepresentation?: SE.ToolTipRepresentation,
  type?: SE.FormItemAdditionType,
  userVisible?: UserVisible,
  verticalAlignInGroup?: SE.ItemVerticalAlign,
  visible?: boolean,
  childItems?: ChildItems,
}

export interface FormItemAdditionXML {
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.DisplayImportance,
  ContextMenu: CommandBar,
  Enabled: boolean,
  ExtendedToolTip: FormDecoration,
  HorizontalAlignInGroup: SE.ItemHorizontalLocation,
  Title: I8nText,
  ToolTip: I8nText,
  ToolTipRepresentation: SE.ToolTipRepresentation,
  Type: SE.FormItemAdditionType,
  UserVisible: UserVisible,
  VerticalAlignInGroup: SE.ItemVerticalAlign,
  Visible: boolean,
  ChildItems: ChildItems,
}