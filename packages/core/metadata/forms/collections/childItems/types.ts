import { FormElementType } from "~/metadata/metadataFactory/types"
import { AutoCommandBar } from "../../elements/autoCommandBar/types"
import { Button, ButtonXML } from "../../elements/button/types"
import { ButtonGroup, ButtonGroupPartialEnterprise, ButtonGroupXML } from "../../elements/buttonGroup/types"
import { CalendarField, CalendarFieldPartialEnterprise, CalendarFieldXML } from "../../elements/calendarField/types"
import { ChartField, ChartFieldPartialEnterprise, ChartFieldXML } from "../../elements/chartField/types"
import { CheckBoxField, CheckBoxFieldPartialEnterprise, CheckBoxFieldXML } from "../../elements/checkBoxField/types"
import {
  ColumnGroup,
  ColumnGroupPartialEnterprise,
  ColumnGroupPropsEnterprise,
  ColumnGroupXML,
} from "../../elements/columnGroup/types"
import {
  CommandBar,
  CommandBarEnterprise,
  CommandBarPartialEnterprise,
  CommandBarXML,
} from "../../elements/commandBar/types"
import {
  DendrogramField,
  DendrogramFieldEnterprise,
  DendrogramFieldPartialEnterprise,
  DendrogramFieldXML,
} from "../../elements/dendrogramField/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldEnterprise,
  FormattedDocumentFieldPartialEnterprise,
  FormattedDocumentFieldXML,
} from "../../elements/formattedDocumentField/types"
import {
  FormDecoration,
  FormDecorationPartialEnterprise,
  FormDecorationPropsEnterprise,
  FormDecorationXML,
} from "../../elements/formDecoration/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "../../elements/formField/types"
import {
  FormGroup,
  FormGroupPartialEnterprise,
  FormGroupPropsEnterprise,
  FormGroupXML,
} from "../../elements/formGroup/types"
import {
  FormItemAddition,
  FormItemAdditionEnterprise,
  FormItemAdditionXML,
} from "../../elements/formItemAddition/types"
import {
  GanttChartField,
  GanttChartFieldEnterprise,
  GanttChartFieldPartialEnterprise,
  GanttChartFieldXML,
} from "../../elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldEnterprise,
  GeographicalSchemaFieldPartialEnterprise,
  GeographicalSchemaFieldXML,
} from "../../elements/geographicalSchemaField/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldEnterprise,
  GraphicalSchemaFieldPartialEnterprise,
  GraphicalSchemaFieldXML,
} from "../../elements/graphicalSchemaField/types"
import {
  HTMLDocumentField,
  HTMLDocumentFieldEnterprise,
  HTMLDocumentFieldPartialEnterprise,
  HTMLDocumentFieldXML,
} from "../../elements/htmlDocumentField/types"
import {
  InputField,
  InputFieldEnterprise,
  InputFieldPartialEnterprise,
  InputFieldXML,
} from "../../elements/inputField/types"
import { LabelDecoration, LabelDecorationEnterprise, LabelDecorationXML } from "../../elements/labelDecoration/types"
import {
  LabelField,
  LabelFieldEnterprise,
  LabelFieldPartialEnterprise,
  LabelFieldXML,
} from "../../elements/labelField/types"
import { Page, PageEnterprise, PagePartialEnterprise, PageXML } from "../../elements/page/types"
import { Pages, PagesPartialEnterprise, PagesXML } from "../../elements/pages/types"
import {
  PdfDocumentField,
  PdfDocumentFieldEnterprise,
  PdfDocumentFieldPartialEnterprise,
  PdfDocumentFieldXML,
} from "../../elements/pdfDocumentField/types"
import {
  PeriodField,
  PeriodFieldEnterprise,
  PeriodFieldPartialEnterprise,
  PeriodFieldXML,
} from "../../elements/periodField/types"
import {
  PictureDecoration,
  PictureDecorationPartialEnterprise,
  PictureDecorationXML,
} from "../../elements/pictureDecoration/types"
import {
  PictureField,
  PictureFieldEnterprise,
  PictureFieldPartialEnterprise,
  PictureFieldXML,
} from "../../elements/pictureField/types"
import {
  PlannerField,
  PlannerFieldEnterprise,
  PlannerFieldPartialEnterprise,
  PlannerFieldXML,
} from "../../elements/plannerField/types"
import { Popup, PopupPartialEnterprise, PopupXML } from "../../elements/popup/types"
import {
  ProgressBarField,
  ProgressBarFieldEnterprise,
  ProgressBarFieldXML,
} from "../../elements/progressBarField/types"
import {
  RadioButtonField,
  RadioButtonFieldEnterprise,
  RadioButtonFieldXML,
} from "../../elements/radioButtonField/types"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
  SearchControlAdditionXML,
} from "../../elements/searchControlAddition/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SearchStringAdditionXML,
} from "../../elements/searchStringAddition/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldEnterprise,
  SpreadSheetDocumentFieldXML,
} from "../../elements/spreadSheetDocumentField/types"
import { Table, TableEnterprise, TableXML } from "../../elements/table/types"
import {
  TextDocumentField,
  TextDocumentFieldEnterprise,
  TextDocumentFieldXML,
} from "../../elements/textDocumentField/types"
import { TrackBarField, TrackBarFieldEnterprise, TrackBarFieldXML } from "../../elements/trackBarField/types"
import {
  UsualGroup,
  UsualGroupEnterprise,
  UsualGroupPartialEnterprise,
  UsualGroupXML,
} from "../../elements/usualGroup/types"
import { ViewStatusAdditionEnterprise } from "../../elements/viewStatusAddition/types"

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
  | FormItemAddition
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
  | FormItemAdditionXML
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
  | ButtonPartialEnterprise
  | ButtonGroupPartialEnterprise
  | CalendarFieldPartialEnterprise
  | ChartFieldPartialEnterprise
  | CheckBoxFieldPartialEnterprise
  | ColumnGroupPartialEnterprise
  | CommandBarPartialEnterprise
  | DendrogramFieldPartialEnterprise
  | FormattedDocumentFieldPartialEnterprise
  | FormDecorationPartialEnterprise
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
  | ProgressBarFieldEnterprise
  | RadioButtonFieldEnterprise
  | SearchControlAdditionEnterprise
  | SearchStringAdditionEnterprise
  | SpreadSheetDocumentFieldEnterprise
  | TableEnterprise
  | TextDocumentFieldEnterprise
  | TrackBarFieldEnterprise
  | UsualGroupEnterprise
  | ViewStatusAdditionEnterprise
  | ColumnGroupPropsEnterprise
  | CommandBarEnterprise
  | DendrogramFieldEnterprise
  | FormattedDocumentFieldEnterprise
  | FormDecorationPropsEnterprise
  | FormFieldEnterprise
  | FormGroupPropsEnterprise
  | FormItemAdditionEnterprise
  | GanttChartFieldEnterprise
  | GeographicalSchemaFieldEnterprise
  | GraphicalSchemaFieldEnterprise
  | HTMLDocumentFieldEnterprise
  | InputFieldEnterprise
  | LabelDecorationEnterprise
  | LabelFieldEnterprise
  | PageEnterprise
  | PagesPartialEnterprise
  | PdfDocumentFieldEnterprise
  | PeriodFieldEnterprise
  | PictureDecorationPartialEnterprise
  | PictureFieldEnterprise
  | PlannerFieldEnterprise
  | PopupPartialEnterprise
  | ProgressBarFieldEnterprise
  | RadioButtonFieldEnterprise
  | SpreadSheetDocumentFieldEnterprise
  | TableEnterprise
  | TextDocumentFieldEnterprise
  | TrackBarFieldEnterprise
  | UsualGroupPartialEnterprise

export type ChildItemsPartialEnterprise = Record<string, ChildItemPartialEnterprise>

export interface ChildItemsStructureResult {
  childItems: ChildItems
  autoCommandBar?: AutoCommandBar
}
