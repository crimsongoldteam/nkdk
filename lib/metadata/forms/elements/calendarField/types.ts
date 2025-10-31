import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"

export const ZCalendarField = ZFormField.extend({
  autoMaxHeight: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  height: z.number().optional(),
  heightInMonths: z.number().optional(),
  endOfRepresentationPeriod: z.string().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  beginOfRepresentationPeriod: z.string().optional(),
  showMonthsPanel: z.boolean().optional(),
  showCurrentDate: z.boolean().optional(),
  calendarNavigation: z.boolean().optional(),
  enableStartDrag: z.boolean().optional(),
  enableDrag: z.boolean().optional(),
  border: ZBorder.optional(),
  verticalStretch: z.boolean().optional(),
  horizontalStretch: z.boolean().optional(),
  selectionMode: SE.ZDateSelectionMode.optional(),
  borderColor: ZColor.optional(),
  width: z.number().optional(),
  widthInMonths: z.number().optional(),
  font: ZFont.optional(),
  value: z.date().optional(),
})

export const ZCalendarFieldXML = ZFormFieldXML.extend({
  AutoMaxHeight: z.boolean().optional(),
  AutoMaxWidth: z.boolean().optional(),
  Height: z.number().optional(),
  HeightInMonths: z.number().optional(),
  EndOfRepresentationPeriod: z.string().optional(),
  MaxHeight: z.number().optional(),
  MaxWidth: z.number().optional(),
  BeginOfRepresentationPeriod: z.string().optional(),
  ShowMonthsPanel: z.boolean().optional(),
  ShowCurrentDate: z.boolean().optional(),
  CalendarNavigation: z.boolean().optional(),
  EnableStartDrag: z.boolean().optional(),
  EnableDrag: z.boolean().optional(),
  Border: ZBorderXML.optional(),
  VerticalStretch: z.boolean().optional(),
  HorizontalStretch: z.boolean().optional(),
  SelectionMode: SE.ZDateSelectionMode.optional(),
  BorderColor: ZColorXML.optional(),
  Width: z.number().optional(),
  WidthInMonths: z.number().optional(),
  Font: ZFontXML.optional(),
})

export type TCalendarField = z.infer<typeof ZCalendarField>

export type TCalendarFieldXML = z.infer<typeof ZCalendarFieldXML>