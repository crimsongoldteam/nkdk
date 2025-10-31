import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZSpreadSheetDocumentField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  verticalScrollBar: SE.ZScrollBarUse.optional(),
  output: SE.ZUseOutput.optional(),
  height: z.number().optional(),
  horizontalScrollBar: SE.ZScrollBarUse.optional(),
  protection: z.boolean().optional(),
  usedFileName: z.string().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  showGroups: z.boolean().optional(),
  showHeaders: z.boolean().optional(),
  showRowAndColumnNames: z.boolean().optional(),
  showCellNames: z.boolean().optional(),
  showGrid: z.boolean().optional(),
  statePresentation: SE.ZStatePresentation.optional(),
  enableStartDrag: z.boolean().optional(),
  enableDrag: z.boolean().optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  edit: z.boolean().optional(),
  viewScalingMode: SE.ZViewScalingMode.optional(),
  selectionShowMode: SE.ZSelectionShowMode.optional(),
  drawingSelectionShowMode: SE.ZDrawingSelectionShowMode.optional(),
  pointerType: SE.ZSpreadsheetDocumentPointerType.optional(),
  borderColor: ZColor.optional(),
  blackAndWhiteView: z.boolean().optional(),
  width: z.number().optional(),
})

export const ZSpreadSheetDocumentFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  VerticalScrollBar: SE.ZScrollBarUse.optional(),
  Output: SE.ZUseOutput.optional(),
  Height: z.number().optional(),
  HorizontalScrollBar: SE.ZScrollBarUse.optional(),
  Protection: z.boolean().optional(),
  UsedFileName: z.string().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  ShowGroups: z.boolean().optional(),
  ShowHeaders: z.boolean().optional(),
  ShowRowAndColumnNames: z.boolean().optional(),
  ShowCellNames: z.boolean().optional(),
  ShowGrid: z.boolean().optional(),
  StatePresentation: SE.ZStatePresentation.optional(),
  EnableStartDrag: z.boolean().optional(),
  EnableDrag: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  Edit: z.boolean().optional(),
  ViewScalingMode: SE.ZViewScalingMode.optional(),
  SelectionShowMode: SE.ZSelectionShowMode.optional(),
  DrawingSelectionShowMode: SE.ZDrawingSelectionShowMode.optional(),
  PointerType: SE.ZSpreadsheetDocumentPointerType.optional(),
  BorderColor: ZColorXML.optional(),
  BlackAndWhiteView: z.boolean().optional(),
  Width: z.number().optional(),
})

export type TSpreadSheetDocumentField = z.infer<typeof ZSpreadSheetDocumentField>

export type TSpreadSheetDocumentFieldXML = z.infer<typeof ZSpreadSheetDocumentFieldXML>