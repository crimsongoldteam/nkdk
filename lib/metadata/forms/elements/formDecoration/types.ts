import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/font/types"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZFormDecoration = ZBaseElement.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  displayImportance: SE.ZDisplayImportance.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  type: SE.ZFormDecorationType.optional(),
  visible: z.boolean().optional(),
  height: z.number().optional(),
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  enabled: z.boolean().optional(),
  title: ZI8nText.optional(),
  get contextMenu() {
    return ZFormGroup.optional()
  },
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  toolTip: ZI8nText.optional(),
  skipOnInput: z.boolean().optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  get extendedTooltip() {
    return ZFormDecoration.optional()
  },
  shortcut: z.string().optional(),
  textColor: ZColor.optional(),
  width: z.number().optional(),
  font: ZFont.optional(),
})

export const ZFormDecorationXML = ZBaseElementXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  DisplayImportance: SE.ZDisplayImportance.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  Type: SE.ZFormDecorationType.optional(),
  Visible: z.boolean().optional(),
  Height: z.number().optional(),
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  Enabled: z.boolean().optional(),
  Title: ZI8nTextXML.optional(),
  get ContextMenu() {
    return ZFormGroupXML.optional()
  },
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  ToolTip: ZI8nTextXML.optional(),
  SkipOnInput: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  Shortcut: z.string().optional(),
  TextColor: ZColorXML.optional(),
  Width: z.number().optional(),
  Font: ZFontXML.optional(),
})

export type TFormDecoration = z.infer<typeof ZFormDecoration>

export type TFormDecorationXML = z.infer<typeof ZFormDecorationXML>