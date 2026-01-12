import { FormElementType } from "~/metadata/metadataFactory/types"
import { AutoCommandBar } from "../../elements/autoCommandBar/types"
import { Button, ButtonPartialEnterprise, ButtonXML } from "../../elements/button/types"
import { ButtonGroup, ButtonGroupPartialEnterprise, ButtonGroupXML } from "../../elements/buttonGroup/types"
import { CalendarField, CalendarFieldPartialEnterprise, CalendarFieldXML } from "../../elements/calendarField/types"
import { ChartField, ChartFieldPartialEnterprise, ChartFieldXML } from "../../elements/chartField/types"
import { CheckBoxField, CheckBoxFieldPartialEnterprise, CheckBoxFieldXML } from "../../elements/checkBoxField/types"
import { ColumnGroup, ColumnGroupPartialEnterprise, ColumnGroupXML } from "../../elements/columnGroup/types"
import { CommandBar, CommandBarPartialEnterprise, CommandBarXML } from "../../elements/commandBar/types"
import {
  DendrogramField,
  DendrogramFieldPartialEnterprise,
  DendrogramFieldXML,
} from "../../elements/dendrogramField/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldPartialEnterprise,
  FormattedDocumentFieldXML,
} from "../../elements/formattedDocumentField/types"
import { FormDecoration, FormDecorationPartialEnterprise, FormDecorationXML } from "../../elements/formDecoration/types"
import { FormField, FormFieldXML } from "../../elements/formField/types"
import { FormGroup, FormGroupPartialEnterprise, FormGroupXML } from "../../elements/formGroup/types"

import {
  GanttChartField,
  GanttChartFieldPartialEnterprise,
  GanttChartFieldXML,
} from "../../elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldPartialEnterprise,
  GeographicalSchemaFieldXML,
} from "../../elements/geographicalSchemaField/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldPartialEnterprise,
  GraphicalSchemaFieldXML,
} from "../../elements/graphicalSchemaField/types"
import {
  HTMLDocumentField,
  HTMLDocumentFieldPartialEnterprise,
  HTMLDocumentFieldXML,
} from "../../elements/htmlDocumentField/types"
import { InputField, InputFieldPartialEnterprise, InputFieldXML } from "../../elements/inputField/types"
import {
  LabelDecoration,
  LabelDecorationPartialEnterprise,
  LabelDecorationXML,
} from "../../elements/labelDecoration/types"
import { LabelField, LabelFieldPartialEnterprise, LabelFieldXML } from "../../elements/labelField/types"
import { Page, PagePartialEnterprise, PageXML } from "../../elements/page/types"
import { Pages, PagesPartialEnterprise, PagesXML } from "../../elements/pages/types"
import {
  PdfDocumentField,
  PdfDocumentFieldPartialEnterprise,
  PdfDocumentFieldXML,
} from "../../elements/pdfDocumentField/types"
import { PeriodField, PeriodFieldPartialEnterprise, PeriodFieldXML } from "../../elements/periodField/types"
import {
  PictureDecoration,
  PictureDecorationPartialEnterprise,
  PictureDecorationXML,
} from "../../elements/pictureDecoration/types"
import { PictureField, PictureFieldPartialEnterprise, PictureFieldXML } from "../../elements/pictureField/types"
import { PlannerField, PlannerFieldPartialEnterprise, PlannerFieldXML } from "../../elements/plannerField/types"
import { Popup, PopupPartialEnterprise, PopupXML } from "../../elements/popup/types"
import {
  ProgressBarField,
  ProgressBarFieldPartialEnterprise,
  ProgressBarFieldXML,
} from "../../elements/progressBarField/types"
import {
  RadioButtonField,
  RadioButtonFieldPartialEnterprise,
  RadioButtonFieldXML,
} from "../../elements/radioButtonField/types"
import { SearchControlAddition, SearchControlAdditionXML } from "../../elements/searchControlAddition/types"
import { SearchStringAddition, SearchStringAdditionXML } from "../../elements/searchStringAddition/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialEnterprise,
  SpreadSheetDocumentFieldXML,
} from "../../elements/spreadSheetDocumentField/types"
import { Table, TablePartialEnterprise, TableXML } from "../../elements/table/types"
import {
  TextDocumentField,
  TextDocumentFieldPartialEnterprise,
  TextDocumentFieldXML,
} from "../../elements/textDocumentField/types"
import { TrackBarField, TrackBarFieldPartialEnterprise, TrackBarFieldXML } from "../../elements/trackBarField/types"
import { UsualGroup, UsualGroupPartialEnterprise, UsualGroupXML } from "../../elements/usualGroup/types"

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
  | FormDecoration
  | FormField
  | FormGroup
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
  | SearchControlAddition
  | SearchStringAddition
  | SpreadSheetDocumentField
  | Table
  | TextDocumentField
  | TrackBarField
  | UsualGroup

export type ChildItems = ChildItem[]

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
  | FormDecorationXML
  | FormFieldXML
  | FormGroupXML
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
  | SearchControlAdditionXML
  | SearchStringAdditionXML
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
  | FormDecorationPartialEnterprise
  | FormattedDocumentFieldPartialEnterprise
  | FormGroupPartialEnterprise
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
