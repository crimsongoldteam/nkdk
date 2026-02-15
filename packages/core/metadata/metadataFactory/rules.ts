import { AutoCommandBar, AutoCommandBarEnterprise } from "../forms/elements/autoCommandBar/types"
import { Button, ButtonPartialEnterprise, ButtonTypedEnterprise } from "../forms/elements/button/types"
import {
  ButtonGroup,
  ButtonGroupPartialEnterprise,
  ButtonGroupTypedEnterprise,
} from "../forms/elements/buttonGroup/types"
import { CalendarField, CalendarFieldPartialEnterprise } from "../forms/elements/calendarField/types"
import { ChartField, ChartFieldPartialEnterprise } from "../forms/elements/chartField/types"
import {
  CheckBoxField,
  CheckBoxFieldPartialEnterprise,
  CheckBoxFieldTypedEnterprise,
} from "../forms/elements/checkBoxField/types"
import {
  ColumnGroup,
  ColumnGroupPartialEnterprise,
  ColumnGroupTypedEnterprise,
} from "../forms/elements/columnGroup/types"
import { CommandBar, CommandBarPartialEnterprise } from "../forms/elements/commandBar/types"
import { ContextMenu, ContextMenuEnterprise } from "../forms/elements/contextMenu/types"
import { DendrogramField, DendrogramFieldPartialEnterprise } from "../forms/elements/dendrogramField/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "../forms/elements/extendedTooltip/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldPartialEnterprise,
} from "../forms/elements/formattedDocumentField/types"
import { GanttChartField, GanttChartFieldPartialEnterprise } from "../forms/elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldPartialEnterprise,
} from "../forms/elements/geographicalSchemaField/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldPartialEnterprise,
} from "../forms/elements/graphicalSchemaField/types"
import { HTMLDocumentField, HTMLDocumentFieldPartialEnterprise } from "../forms/elements/htmlDocumentField/types"
import { InputField, InputFieldPartialEnterprise, InputFieldTypedEnterprise } from "../forms/elements/inputField/types"
import { LabelDecoration, LabelDecorationPartialEnterprise } from "../forms/elements/labelDecoration/types"
import { LabelField, LabelFieldPartialEnterprise, LabelFieldTypedEnterprise } from "../forms/elements/labelField/types"
import { Page, PagePartialEnterprise } from "../forms/elements/page/types"
import { Pages, PagesPartialEnterprise } from "../forms/elements/pages/types"
import { PdfDocumentField, PdfDocumentFieldPartialEnterprise } from "../forms/elements/pdfDocumentField/types"
import { PeriodField, PeriodFieldPartialEnterprise } from "../forms/elements/periodField/types"
import { PictureDecoration, PictureDecorationPartialEnterprise } from "../forms/elements/pictureDecoration/types"
import {
  PictureField,
  PictureFieldPartialEnterprise,
  PictureFieldTypedEnterprise,
} from "../forms/elements/pictureField/types"
import { PlannerField, PlannerFieldPartialEnterprise } from "../forms/elements/plannerField/types"
import { Popup, PopupPartialEnterprise, PopupTypedEnterprise } from "../forms/elements/popup/types"
import { ProgressBarField, ProgressBarFieldPartialEnterprise } from "../forms/elements/progressBarField/types"
import { RadioButtonField, RadioButtonFieldPartialEnterprise } from "../forms/elements/radioButtonField/types"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
  SingleSearchControlAddition,
  SingleSearchControlAdditionEnterprise,
} from "../forms/elements/searchControlAddition/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SingleSearchStringAddition,
  SingleSearchStringAdditionEnterprise,
} from "../forms/elements/searchStringAddition/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialEnterprise,
} from "../forms/elements/spreadSheetDocumentField/types"
import { Table, TablePartialEnterprise } from "../forms/elements/table/types"
import { TextDocumentField, TextDocumentFieldPartialEnterprise } from "../forms/elements/textDocumentField/types"
import { TrackBarField, TrackBarFieldPartialEnterprise } from "../forms/elements/trackBarField/types"
import { UsualGroup, UsualGroupPartialEnterprise } from "../forms/elements/usualGroup/types"

export type ToYAML<T> = ExtractRule<T, ToYAMLRule>

export type ToTypedYAML<T> = ExtractRule<T, ToTypedYAMLRule>

type ToYAMLRule =
  | [Button, ButtonPartialEnterprise]
  | [ButtonGroup, ButtonGroupPartialEnterprise]
  | [CalendarField, CalendarFieldPartialEnterprise]
  | [ChartField, ChartFieldPartialEnterprise]
  | [CheckBoxField, CheckBoxFieldPartialEnterprise]
  | [ColumnGroup, ColumnGroupPartialEnterprise]
  | [CommandBar, CommandBarPartialEnterprise]
  | [DendrogramField, DendrogramFieldPartialEnterprise]
  | [FormattedDocumentField, FormattedDocumentFieldPartialEnterprise]
  | [GanttChartField, GanttChartFieldPartialEnterprise]
  | [GeographicalSchemaField, GeographicalSchemaFieldPartialEnterprise]
  | [GraphicalSchemaField, GraphicalSchemaFieldPartialEnterprise]
  | [HTMLDocumentField, HTMLDocumentFieldPartialEnterprise]
  | [InputField, InputFieldPartialEnterprise]
  | [LabelDecoration, LabelDecorationPartialEnterprise]
  | [LabelField, LabelFieldPartialEnterprise]
  | [Page, PagePartialEnterprise]
  | [Pages, PagesPartialEnterprise]
  | [PdfDocumentField, PdfDocumentFieldPartialEnterprise]
  | [PeriodField, PeriodFieldPartialEnterprise]
  | [PictureDecoration, PictureDecorationPartialEnterprise]
  | [PictureField, PictureFieldPartialEnterprise]
  | [PlannerField, PlannerFieldPartialEnterprise]
  | [Popup, PopupPartialEnterprise]
  | [ProgressBarField, ProgressBarFieldPartialEnterprise]
  | [RadioButtonField, RadioButtonFieldPartialEnterprise]
  | [SpreadSheetDocumentField, SpreadSheetDocumentFieldPartialEnterprise]
  | [Table, TablePartialEnterprise]
  | [SearchControlAddition, SearchControlAdditionEnterprise]
  | [SingleSearchControlAddition, SingleSearchControlAdditionEnterprise]
  | [SingleSearchStringAddition, SingleSearchStringAdditionEnterprise]
  | [SearchStringAddition, SearchStringAdditionEnterprise]
  | [TextDocumentField, TextDocumentFieldPartialEnterprise]
  | [TrackBarField, TrackBarFieldPartialEnterprise]
  | [UsualGroup, UsualGroupPartialEnterprise]
  | [ContextMenu, ContextMenuEnterprise]
  | [AutoCommandBar, AutoCommandBarEnterprise]
  | [ExtendedTooltip, ExtendedTooltipEnterprise]

type ToTypedYAMLRule =
  | [Button, ButtonTypedEnterprise]
  | [ButtonGroup, ButtonGroupTypedEnterprise]
  | [Popup, PopupTypedEnterprise]
  | [CheckBoxField, CheckBoxFieldTypedEnterprise]
  | [ColumnGroup, ColumnGroupTypedEnterprise]
  | [InputField, InputFieldTypedEnterprise]
  | [LabelField, LabelFieldTypedEnterprise]
  | [PictureField, PictureFieldTypedEnterprise]

type ExtractRule<T, M> = M extends [T, infer R] ? R : never
