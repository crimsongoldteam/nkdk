import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { TChildItems } from "../childItems/typesExt"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"

export const ZFormItemAddition = z.object({
  elementType: ZElementType,
  name: z.string(),
  id: z.string().optional(),
  get contextMenu() {
    return ZCommandBar.optional()
  },
  displayImportance: SE.ZDisplayImportance.optional(),
  enabled: z.boolean().optional(),
  get extendedToolTip() {
    return ZFormDecoration.optional()
  },
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  title: ZI8nText.optional(),
  toolTip: ZI8nText.optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  type: SE.ZFormItemAdditionType.optional(),
  userVisible: ZUserVisible.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  visible: z.boolean().optional(),
  get childItems() : TChildItems {
    return ZChildItems
  },
})

export const ZFormItemAdditionXML = z.object({
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  get ContextMenu() {
    return ZCommandBarXML.optional()
  },
  Enabled: z.boolean().optional(),
  get ExtendedToolTip() {
    return ZFormDecorationXML.optional()
  },
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  Title: ZI8nTextXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Type: SE.ZFormItemAdditionType.optional(),
  UserVisible: ZUserVisibleXML.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  Visible: z.boolean().optional(),
  get ChildItems() {
    return ZChildItemsXML.optional()
  },
})

export type TFormItemAddition = z.infer<typeof ZFormItemAddition>

export type TFormItemAdditionXML = z.infer<typeof ZFormItemAdditionXML>