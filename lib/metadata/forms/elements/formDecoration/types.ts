import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZFormDecoration = ZBaseElement.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  get contextMenu() {
    return ZFormGroup.optional()
  },
  displayImportance: SE.ZDisplayImportance.optional(),
  enabled: z.boolean().optional(),
  get extendedTooltip() {
    return ZFormDecoration.optional()
  },
  font: ZFont.optional(),
  height: z.number().optional(),
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  horizontalStretch: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  shortcut: z.string().optional(),
  skipOnInput: z.boolean().optional(),
  textColor: ZColor.optional(),
  title: ZI8nText.optional(),
  toolTip: ZI8nText.optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  type: SE.ZFormDecorationType.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  verticalStretch: z.boolean().optional(),
  visible: z.boolean().optional(),
  width: z.number().optional(),
})

export const ZFormDecorationXML = ZBaseElementXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  get ContextMenu() {
    return ZFormGroupXML.optional()
  },
  DisplayImportance: SE.ZDisplayImportance.optional(),
  Enabled: z.boolean().optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  Font: ZFontXML.optional(),
  Height: z.number().optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  HorizontalStretch: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  Shortcut: z.string().optional(),
  SkipOnInput: z.boolean().optional(),
  TextColor: ZColorXML.optional(),
  Title: ZI8nTextXML.optional(),
  ToolTip: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  Type: SE.ZFormDecorationType.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  VerticalStretch: z.boolean().optional(),
  Visible: z.boolean().optional(),
  Width: z.number().optional(),
})

export type TFormDecoration = z.infer<typeof ZFormDecoration>

export type TFormDecorationXML = z.infer<typeof ZFormDecorationXML>