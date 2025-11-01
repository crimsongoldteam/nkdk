import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"

export const ZFormItemAddition = ZBaseElement.extend({
  get contextMenu() {
    return ZFormGroup.optional()
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
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  visible: z.boolean().optional(),
  get childItems() {
    return ZChildItems
  },
})

export const ZFormItemAdditionXML = ZBaseElementXML.extend({
  get ContextMenu() {
    return ZFormGroupXML.optional()
  },
  DisplayImportance: SE.ZDisplayImportance.optional(),
  Enabled: z.boolean().optional(),
  get ExtendedToolTip() {
    return ZFormDecorationXML.optional()
  },
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  Title: ZI8nTextXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Type: SE.ZFormItemAdditionType.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  Visible: z.boolean().optional(),
  get ChildItems() {
    return ZChildItemsXML.optional()
  },
})

export type TFormItemAddition = z.infer<typeof ZFormItemAddition>

export type TFormItemAdditionXML = z.infer<typeof ZFormItemAdditionXML>