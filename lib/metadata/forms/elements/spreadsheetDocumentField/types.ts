import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZSpreadSheetDocumentField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  blackAndWhiteView: z.boolean().optional(),
  borderColor: ZColor.optional(),
  drawingSelectionShowMode: SE.ZDrawingSelectionShowMode.optional(),
  edit: z.boolean().optional(),
  enableDrag: z.boolean().optional(),
  enableStartDrag: z.boolean().optional(),
  height: z.number().optional(),
  horizontalScrollBar: SE.ZScrollBarUse.optional(),
  horizontalStretch: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  output: SE.ZUseOutput.optional(),
  pointerType: SE.ZSpreadsheetDocumentPointerType.optional(),
  protection: z.boolean().optional(),
  selectionShowMode: SE.ZSelectionShowMode.optional(),
  showCellNames: z.boolean().optional(),
  showGrid: z.boolean().optional(),
  showGroups: z.boolean().optional(),
  showHeaders: z.boolean().optional(),
  showRowAndColumnNames: z.boolean().optional(),
  statePresentation: SE.ZStatePresentation.optional(),
  usedFileName: z.string().optional(),
  verticalScrollBar: SE.ZScrollBarUse.optional(),
  verticalStretch: z.boolean().optional(),
  viewScalingMode: SE.ZViewScalingMode.optional(),
  width: z.number().optional(),
})

export const ZSpreadSheetDocumentFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  BlackAndWhiteView: z.boolean().optional(),
  BorderColor: ZColorXML.optional(),
  DrawingSelectionShowMode: SE.ZDrawingSelectionShowMode.optional(),
  Edit: z.boolean().optional(),
  EnableDrag: z.boolean().optional(),
  EnableStartDrag: z.boolean().optional(),
  Height: z.number().optional(),
  HorizontalScrollBar: SE.ZScrollBarUse.optional(),
  HorizontalStretch: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  Output: SE.ZUseOutput.optional(),
  PointerType: SE.ZSpreadsheetDocumentPointerType.optional(),
  Protection: z.boolean().optional(),
  SelectionShowMode: SE.ZSelectionShowMode.optional(),
  ShowCellNames: z.boolean().optional(),
  ShowGrid: z.boolean().optional(),
  ShowGroups: z.boolean().optional(),
  ShowHeaders: z.boolean().optional(),
  ShowRowAndColumnNames: z.boolean().optional(),
  StatePresentation: SE.ZStatePresentation.optional(),
  UsedFileName: z.string().optional(),
  VerticalScrollBar: SE.ZScrollBarUse.optional(),
  VerticalStretch: z.boolean().optional(),
  ViewScalingMode: SE.ZViewScalingMode.optional(),
  Width: z.number().optional(),
})

export type TSpreadSheetDocumentField = z.infer<typeof ZSpreadSheetDocumentField>

export type TSpreadSheetDocumentFieldXML = z.infer<typeof ZSpreadSheetDocumentFieldXML>