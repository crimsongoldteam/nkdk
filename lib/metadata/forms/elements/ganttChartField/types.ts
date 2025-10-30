import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZGanttChartField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  verticalLines: z.boolean().optional(),
  selectedValues: ZМассив.optional(),
  selectedIntervals: ZМассив.optional(),
  height: z.number().optional(),
  horizontalLines: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  tableLocation: SE.ZGanttChartTableLocation.optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  valuesSelectionMode: SE.ZGanttChartValuesSelectionMode.optional(),
  intervalsSelectionMode: SE.ZGanttChartIntervalsSelectionMode.optional(),
  currentValue: ZИдентификаторЗначенияДиаграммыГанта.optional(),
  currentInterval: ZИдентификаторИнтервалаДиаграммыГанта.optional(),
  width: z.number().optional(),
})

export const ZGanttChartFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  VerticalLines: z.boolean().optional(),
  SelectedValues: ZМассивXML.optional(),
  SelectedIntervals: ZМассивXML.optional(),
  Height: z.number().optional(),
  HorizontalLines: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  TableLocation: SE.ZGanttChartTableLocation.optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  ValuesSelectionMode: SE.ZGanttChartValuesSelectionMode.optional(),
  IntervalsSelectionMode: SE.ZGanttChartIntervalsSelectionMode.optional(),
  CurrentValue: ZИдентификаторЗначенияДиаграммыГантаXML.optional(),
  CurrentInterval: ZИдентификаторИнтервалаДиаграммыГантаXML.optional(),
  Width: z.number().optional(),
})

export type TGanttChartField = z.infer<typeof ZGanttChartField>

export type TGanttChartFieldXML = z.infer<typeof ZGanttChartFieldXML>