import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZCalendarField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  beginOfRepresentationPeriod: z.string().optional(),
  border: ZBorder.optional(),
  borderColor: ZColor.optional(),
  calendarNavigation: z.boolean().optional(),
  enableDrag: z.boolean().optional(),
  enableStartDrag: z.boolean().optional(),
  endOfRepresentationPeriod: z.string().optional(),
  font: ZFont.optional(),
  height: z.number().optional(),
  heightInMonths: z.number().optional(),
  horizontalStretch: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  selectionMode: SE.ZDateSelectionMode.optional(),
  showCurrentDate: z.boolean().optional(),
  showMonthsPanel: z.boolean().optional(),
  verticalStretch: z.boolean().optional(),
  width: z.number().optional(),
  widthInMonths: z.number().optional(),
  value: z.date().optional(),
})

export const ZCalendarFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  BeginOfRepresentationPeriod: z.string().optional(),
  Border: ZBorderXML.optional(),
  BorderColor: ZColorXML.optional(),
  CalendarNavigation: z.boolean().optional(),
  EnableDrag: z.boolean().optional(),
  EnableStartDrag: z.boolean().optional(),
  EndOfRepresentationPeriod: z.string().optional(),
  Font: ZFontXML.optional(),
  Height: z.number().optional(),
  HeightInMonths: z.number().optional(),
  HorizontalStretch: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  SelectionMode: SE.ZDateSelectionMode.optional(),
  ShowCurrentDate: z.boolean().optional(),
  ShowMonthsPanel: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  Width: z.number().optional(),
  WidthInMonths: z.number().optional(),
})

export type TCalendarField = z.infer<typeof ZCalendarField>

export type TCalendarFieldXML = z.infer<typeof ZCalendarFieldXML>