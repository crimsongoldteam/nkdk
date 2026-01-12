import { FormElementType } from "~/metadata/metadataFactory/types"
import { AutoCommandBar } from "../../elements/autoCommandBar/types"
import { Button, ButtonEnterprise, ButtonXML } from "../../elements/button/types"
import { ButtonGroup, ButtonGroupPartialEnterprise, ButtonGroupXML } from "../../elements/buttonGroup/types"
import { CalendarField, CalendarFieldEnterprise, CalendarFieldXML } from "../../elements/calendarField/types"
import { ChartField, ChartFieldEnterprise, ChartFieldXML } from "../../elements/chartField/types"
import { CheckBoxField, CheckBoxFieldEnterprise, CheckBoxFieldXML } from "../../elements/checkBoxField/types"
import { ColumnGroup, ColumnGroupPropsEnterprise, ColumnGroupXML } from "../../elements/columnGroup/types"
import { CommandBar, CommandBarEnterprise, CommandBarXML } from "../../elements/commandBar/types"
import { DendrogramField, DendrogramFieldEnterprise, DendrogramFieldXML } from "../../elements/dendrogramField/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldEnterprise,
  FormattedDocumentFieldXML,
} from "../../elements/formattedDocumentField/types"
import { FormDecoration, FormDecorationPropsEnterprise, FormDecorationXML } from "../../elements/formDecoration/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "../../elements/formField/types"
import { FormGroup, FormGroupPropsEnterprise, FormGroupXML } from "../../elements/formGroup/types"
import {
  FormItemAddition,
  FormItemAdditionEnterprise,
  FormItemAdditionXML,
} from "../../elements/formItemAddition/types"
import { GanttChartField, GanttChartFieldEnterprise, GanttChartFieldXML } from "../../elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldEnterprise,
  GeographicalSchemaFieldXML,
} from "../../elements/geographicalSchemaField/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldEnterprise,
  GraphicalSchemaFieldXML,
} from "../../elements/graphicalSchemaField/types"
import {
  HTMLDocumentField,
  HTMLDocumentFieldEnterprise,
  HTMLDocumentFieldXML,
} from "../../elements/htmlDocumentField/types"
import { InputField, InputFieldEnterprise, InputFieldXML } from "../../elements/inputField/types"
import { LabelDecoration, LabelDecorationEnterprise, LabelDecorationXML } from "../../elements/labelDecoration/types"
import { LabelField, LabelFieldEnterprise, LabelFieldXML } from "../../elements/labelField/types"
import { Page, PageEnterprise, PageXML } from "../../elements/page/types"
import { Pages, PagesEnterprise, PagesXML } from "../../elements/pages/types"
import {
  PdfDocumentField,
  PdfDocumentFieldEnterprise,
  PdfDocumentFieldXML,
} from "../../elements/pdfDocumentField/types"
import { PeriodField, PeriodFieldEnterprise, PeriodFieldXML } from "../../elements/periodField/types"
import {
  PictureDecoration,
  PictureDecorationEnterprise,
  PictureDecorationXML,
} from "../../elements/pictureDecoration/types"
import { PictureField, PictureFieldEnterprise, PictureFieldXML } from "../../elements/pictureField/types"
import { PlannerField, PlannerFieldEnterprise, PlannerFieldXML } from "../../elements/plannerField/types"
import { Popup, PopupEnterprise, PopupXML } from "../../elements/popup/types"
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
import { UsualGroup, UsualGroupEnterprise, UsualGroupXML } from "../../elements/usualGroup/types"
import {
  ViewStatusAddition,
  ViewStatusAdditionEnterprise,
  ViewStatusAdditionXML,
} from "../../elements/viewStatusAddition/types"

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
  | ViewStatusAddition

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
  | ViewStatusAdditionXML

export type ChildItemRecordXML = Record<FormElementType, ChildItemXML>

export type ChildItemsXML = ChildItemRecordXML | ChildItemRecordXML[]

export type ChildItemEnterprise =
  | ButtonEnterprise
  | ButtonGroupPartialEnterprise
  | CalendarFieldEnterprise
  | ChartFieldEnterprise
  | CheckBoxFieldEnterprise
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
  | PagesEnterprise
  | PdfDocumentFieldEnterprise
  | PeriodFieldEnterprise
  | PictureDecorationEnterprise
  | PictureFieldEnterprise
  | PlannerFieldEnterprise
  | PopupEnterprise
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
  | PagesEnterprise
  | PdfDocumentFieldEnterprise
  | PeriodFieldEnterprise
  | PictureDecorationEnterprise
  | PictureFieldEnterprise
  | PlannerFieldEnterprise
  | PopupEnterprise
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

export type ChildItemsEnterprise = Record<string, ChildItemEnterprise>

export interface ChildItemsStructureResult {
  childItems: ChildItems
  autoCommandBar?: AutoCommandBar
}
