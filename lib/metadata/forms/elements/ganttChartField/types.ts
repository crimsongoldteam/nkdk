import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZGanttChartField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  height: z.number().optional(),
  horizontalLines: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  intervalsSelectionMode: SE.ZGanttChartIntervalsSelectionMode.optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  tableLocation: SE.ZGanttChartTableLocation.optional(),
  valuesSelectionMode: SE.ZGanttChartValuesSelectionMode.optional(),
  verticalLines: z.boolean().optional(),
  verticalStretch: z.boolean().optional(),
  width: z.number().optional(),
})

export const ZGanttChartFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Height: z.number().optional(),
  HorizontalLines: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  IntervalsSelectionMode: SE.ZGanttChartIntervalsSelectionMode.optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  TableLocation: SE.ZGanttChartTableLocation.optional(),
  ValuesSelectionMode: SE.ZGanttChartValuesSelectionMode.optional(),
  VerticalLines: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  Width: z.number().optional(),
})

export type TGanttChartField = z.infer<typeof ZGanttChartField>

export type TGanttChartFieldXML = z.infer<typeof ZGanttChartFieldXML>