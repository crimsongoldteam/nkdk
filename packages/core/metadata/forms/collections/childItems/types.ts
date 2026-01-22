import { FormElementType } from "~/metadata/metadataFactory/types"
import { FormFieldTypeEnterprise } from "~/metadata/systemEnumerations/types"
import { AutoCommandBar } from "../../elements/autoCommandBar/types"
import { Button, ButtonPartialEnterprise, ButtonTypedEnterprise, ButtonXML } from "../../elements/button/types"
import {
  ButtonGroup,
  ButtonGroupPartialEnterprise,
  ButtonGroupTypedEnterprise,
  ButtonGroupXML,
} from "../../elements/buttonGroup/types"
import {
  CalendarField,
  CalendarFieldPartialEnterprise,
  CalendarFieldTypedEnterprise,
  CalendarFieldXML,
} from "../../elements/calendarField/types"
import {
  ChartField,
  ChartFieldPartialEnterprise,
  ChartFieldTypedEnterprise,
  ChartFieldXML,
} from "../../elements/chartField/types"
import {
  CheckBoxField,
  CheckBoxFieldPartialEnterprise,
  CheckBoxFieldTypedEnterprise,
  CheckBoxFieldXML,
} from "../../elements/checkBoxField/types"
import {
  ColumnGroup,
  ColumnGroupPartialEnterprise,
  ColumnGroupTypedEnterprise,
  ColumnGroupXML,
} from "../../elements/columnGroup/types"
import {
  CommandBar,
  CommandBarPartialEnterprise,
  CommandBarTypedEnterprise,
  CommandBarXML,
} from "../../elements/commandBar/types"
import {
  DendrogramField,
  DendrogramFieldPartialEnterprise,
  DendrogramFieldTypedEnterprise,
  DendrogramFieldXML,
} from "../../elements/dendrogramField/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldPartialEnterprise,
  FormattedDocumentFieldTypedEnterprise,
  FormattedDocumentFieldXML,
} from "../../elements/formattedDocumentField/types"
import {
  GanttChartField,
  GanttChartFieldPartialEnterprise,
  GanttChartFieldTypedEnterprise,
  GanttChartFieldXML,
} from "../../elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldPartialEnterprise,
  GeographicalSchemaFieldTypedEnterprise,
  GeographicalSchemaFieldXML,
} from "../../elements/geographicalSchemaField/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldPartialEnterprise,
  GraphicalSchemaFieldTypedEnterprise,
  GraphicalSchemaFieldXML,
} from "../../elements/graphicalSchemaField/types"
import {
  HTMLDocumentField,
  HTMLDocumentFieldPartialEnterprise,
  HTMLDocumentFieldTypedEnterprise,
  HTMLDocumentFieldXML,
} from "../../elements/htmlDocumentField/types"
import {
  InputField,
  InputFieldPartialEnterprise,
  InputFieldTypedEnterprise,
  InputFieldXML,
} from "../../elements/inputField/types"
import {
  LabelDecoration,
  LabelDecorationPartialEnterprise,
  LabelDecorationTypedEnterprise,
  LabelDecorationXML,
} from "../../elements/labelDecoration/types"
import {
  LabelField,
  LabelFieldPartialEnterprise,
  LabelFieldTypedEnterprise,
  LabelFieldXML,
} from "../../elements/labelField/types"
import { Page, PagePartialEnterprise, PageTypedEnterprise, PageXML } from "../../elements/page/types"
import { Pages, PagesPartialEnterprise, PagesTypedEnterprise, PagesXML } from "../../elements/pages/types"
import {
  PdfDocumentField,
  PdfDocumentFieldPartialEnterprise,
  PdfDocumentFieldTypedEnterprise,
  PdfDocumentFieldXML,
} from "../../elements/pdfDocumentField/types"
import {
  PeriodField,
  PeriodFieldPartialEnterprise,
  PeriodFieldTypedEnterprise,
  PeriodFieldXML,
} from "../../elements/periodField/types"
import {
  PictureDecoration,
  PictureDecorationPartialEnterprise,
  PictureDecorationTypedEnterprise,
  PictureDecorationXML,
} from "../../elements/pictureDecoration/types"
import {
  PictureField,
  PictureFieldPartialEnterprise,
  PictureFieldTypedEnterprise,
  PictureFieldXML,
} from "../../elements/pictureField/types"
import {
  PlannerField,
  PlannerFieldPartialEnterprise,
  PlannerFieldTypedEnterprise,
  PlannerFieldXML,
} from "../../elements/plannerField/types"
import { Popup, PopupPartialEnterprise, PopupTypedEnterprise, PopupXML } from "../../elements/popup/types"
import {
  ProgressBarField,
  ProgressBarFieldPartialEnterprise,
  ProgressBarFieldTypedEnterprise,
  ProgressBarFieldXML,
} from "../../elements/progressBarField/types"
import {
  RadioButtonField,
  RadioButtonFieldPartialEnterprise,
  RadioButtonFieldTypedEnterprise,
  RadioButtonFieldXML,
} from "../../elements/radioButtonField/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialEnterprise,
  SpreadSheetDocumentFieldTypedEnterprise,
  SpreadSheetDocumentFieldXML,
} from "../../elements/spreadSheetDocumentField/types"
import { Table, TablePartialEnterprise, TableXML } from "../../elements/table/types"
import {
  TextDocumentField,
  TextDocumentFieldPartialEnterprise,
  TextDocumentFieldTypedEnterprise,
  TextDocumentFieldXML,
} from "../../elements/textDocumentField/types"
import {
  TrackBarField,
  TrackBarFieldPartialEnterprise,
  TrackBarFieldTypedEnterprise,
  TrackBarFieldXML,
} from "../../elements/trackBarField/types"
import {
  UsualGroup,
  UsualGroupPartialEnterprise,
  UsualGroupTypedEnterprise,
  UsualGroupXML,
} from "../../elements/usualGroup/types"
import { CommandBarChildItem, CommandBarChildItemPartialEnterprise } from "../commandBarChildItems/types"

export type ChildItem =
  | Button
  | ButtonGroup
  | CalendarField
  | ChartField
  | CheckBoxField
  | ColumnGroup
  | CommandBar
  | DendrogramField
  | FormattedDocumentField
  // | FormDecoration
  // | FormField
  // | FormGroup
  | GanttChartField
  | GeographicalSchemaField
  | GraphicalSchemaField
  | HTMLDocumentField
  | InputField
  | LabelDecoration
  | LabelField
  | Page
  | Pages
  | PdfDocumentField
  | PeriodField
  | PictureDecoration
  | PictureField
  | PlannerField
  | Popup
  | ProgressBarField
  | RadioButtonField
  | SpreadSheetDocumentField
  | Table
  | TextDocumentField
  | TrackBarField
  | UsualGroup

export type ChildItems = ChildItem[]

export type AllChildItem = ChildItem | CommandBarChildItem

export type AllChildItems = (ChildItem | CommandBarChildItem)[]

export type AllChildItemsPartialEnterprise = Record<
  string,
  ChildItemPartialEnterprise | CommandBarChildItemPartialEnterprise
>

export type ChildItemXML =
  | ButtonXML
  | ButtonGroupXML
  | CalendarFieldXML
  | ChartFieldXML
  | CheckBoxFieldXML
  | ColumnGroupXML
  | CommandBarXML
  | DendrogramFieldXML
  | FormattedDocumentFieldXML
  | GanttChartFieldXML
  | GeographicalSchemaFieldXML
  | GraphicalSchemaFieldXML
  | HTMLDocumentFieldXML
  | InputFieldXML
  | LabelDecorationXML
  | LabelFieldXML
  | PageXML
  | PagesXML
  | PdfDocumentFieldXML
  | PeriodFieldXML
  | PictureDecorationXML
  | PictureFieldXML
  | PlannerFieldXML
  | PopupXML
  | ProgressBarFieldXML
  | RadioButtonFieldXML
  | SpreadSheetDocumentFieldXML
  | TableXML
  | TextDocumentFieldXML
  | TrackBarFieldXML
  | UsualGroupXML

export type ChildItemRecordXML = Record<FormElementType, ChildItemXML>

export type ChildItemsXML = ChildItemRecordXML | ChildItemRecordXML[]

export type ChildItemPartialEnterprise =
  | ButtonGroupPartialEnterprise
  | ButtonPartialEnterprise
  | CalendarFieldPartialEnterprise
  | ChartFieldPartialEnterprise
  | CheckBoxFieldPartialEnterprise
  | ColumnGroupPartialEnterprise
  | CommandBarPartialEnterprise
  | DendrogramFieldPartialEnterprise
  | FormattedDocumentFieldPartialEnterprise
  | GanttChartFieldPartialEnterprise
  | GeographicalSchemaFieldPartialEnterprise
  | GraphicalSchemaFieldPartialEnterprise
  | HTMLDocumentFieldPartialEnterprise
  | InputFieldPartialEnterprise
  | LabelDecorationPartialEnterprise
  | LabelFieldPartialEnterprise
  | PagePartialEnterprise
  | PagesPartialEnterprise
  | PdfDocumentFieldPartialEnterprise
  | PeriodFieldPartialEnterprise
  | PictureDecorationPartialEnterprise
  | PictureFieldPartialEnterprise
  | PlannerFieldPartialEnterprise
  | PopupPartialEnterprise
  | ProgressBarFieldPartialEnterprise
  | RadioButtonFieldPartialEnterprise
  | SpreadSheetDocumentFieldPartialEnterprise
  | TablePartialEnterprise
  | UsualGroupPartialEnterprise
  | LabelDecorationPartialEnterprise
  | PeriodFieldPartialEnterprise
  | PictureFieldPartialEnterprise
  | PlannerFieldPartialEnterprise
  | ProgressBarFieldPartialEnterprise
  | RadioButtonFieldPartialEnterprise
  | SpreadSheetDocumentFieldPartialEnterprise
  | TextDocumentFieldPartialEnterprise
  | TrackBarFieldPartialEnterprise

export type ChildItemsPartialEnterprise = Record<string, ChildItemPartialEnterprise>

export interface ChildItemsStructureResult {
  childItems: ChildItems
  autoCommandBar?: AutoCommandBar
}

export type ChildItemTypedEnterprise = (
  | ButtonGroupTypedEnterprise
  | ButtonTypedEnterprise
  | CalendarFieldTypedEnterprise
  | ChartFieldTypedEnterprise
  | CheckBoxFieldTypedEnterprise
  | ColumnGroupTypedEnterprise
  | CommandBarTypedEnterprise
  | DendrogramFieldTypedEnterprise
  | FormattedDocumentFieldTypedEnterprise
  | GanttChartFieldTypedEnterprise
  | GeographicalSchemaFieldTypedEnterprise
  | GraphicalSchemaFieldTypedEnterprise
  | HTMLDocumentFieldTypedEnterprise
  | InputFieldTypedEnterprise
  | LabelDecorationTypedEnterprise
  | LabelFieldTypedEnterprise
  | PageTypedEnterprise
  | PagesTypedEnterprise
  | PdfDocumentFieldTypedEnterprise
  | PeriodFieldTypedEnterprise
  | PictureDecorationTypedEnterprise
  | PictureFieldTypedEnterprise
  | PlannerFieldTypedEnterprise
  | PopupTypedEnterprise
  | ProgressBarFieldTypedEnterprise
  | RadioButtonFieldTypedEnterprise
  | SpreadSheetDocumentFieldTypedEnterprise
  | UsualGroupTypedEnterprise
  | LabelDecorationTypedEnterprise
  | PeriodFieldTypedEnterprise
  | PictureFieldTypedEnterprise
  | PlannerFieldTypedEnterprise
  | ProgressBarFieldTypedEnterprise
  | RadioButtonFieldTypedEnterprise
  | SpreadSheetDocumentFieldTypedEnterprise
  | TextDocumentFieldTypedEnterprise
  | TrackBarFieldTypedEnterprise
) & { Тип: FormFieldTypeEnterprise }

export type ChildItemsTypedEnterprise = Record<string, ChildItemTypedEnterprise>
