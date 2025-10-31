import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/i8nText/types"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"

export const ZFormItemAddition = ZBaseElement.extend({
  displayImportance: SE.ZDisplayImportance.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  type: SE.ZFormItemAdditionType.optional(),
  visible: z.boolean().optional(),
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  enabled: z.boolean().optional(),
  title: ZI8nText.optional(),
  get contextMenu() {
    return ZFormGroup.optional()
  },
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  toolTip: ZI8nText.optional(),
  childItems: ZChildItems,
  get extendedToolTip() {
    return ZFormDecoration.optional()
  },
})

export const ZFormItemAdditionXML = ZBaseElementXML.extend({
  DisplayImportance: SE.ZDisplayImportance.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  Type: SE.ZFormItemAdditionType.optional(),
  Visible: z.boolean().optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  Enabled: z.boolean().optional(),
  Title: ZI8nTextXML.optional(),
  get ContextMenu() {
    return ZFormGroupXML.optional()
  },
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ChildItems: ZChildItemsXML,
  get ExtendedToolTip() {
    return ZFormDecorationXML.optional()
  },
})

export type TFormItemAddition = z.infer<typeof ZFormItemAddition>

export type TFormItemAdditionXML = z.infer<typeof ZFormItemAdditionXML>