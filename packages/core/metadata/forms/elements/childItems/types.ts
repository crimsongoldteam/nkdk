import { FormElementType } from "~/metadata/metadataFactory/types"
import { Button, ButtonEnterprise, ButtonXML } from "../button/types"
import { ButtonGroup, ButtonGroupEnterprise, ButtonGroupXML } from "../buttonGroup/types"
import { CalendarField, CalendarFieldEnterprise, CalendarFieldXML } from "../calendarField/types"
import { ChartField, ChartFieldEnterprise, ChartFieldXML } from "../chartField/types"
import { CheckBoxField, CheckBoxFieldEnterprise, CheckBoxFieldXML } from "../checkBoxField/types"
import { ColumnGroup, ColumnGroupEnterprise, ColumnGroupXML } from "../columnGroup/types"
import { CommandBar, CommandBarEnterprise, CommandBarXML } from "../commandBar/types"
import { DendrogramField, DendrogramFieldEnterprise, DendrogramFieldXML } from "../dendrogramField/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldEnterprise,
  FormattedDocumentFieldXML,
} from "../formattedDocumentField/types"
import { FormDecoration, FormDecorationEnterprise, FormDecorationXML } from "../formDecoration/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "../formField/types"
import { FormGroup, FormGroupEnterprise, FormGroupXML } from "../formGroup/types"
import { FormItemAddition, FormItemAdditionEnterprise, FormItemAdditionXML } from "../formItemAddition/types"
import { GanttChartField, GanttChartFieldEnterprise, GanttChartFieldXML } from "../ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldEnterprise,
  GeographicalSchemaFieldXML,
} from "../geographicalSchemaField/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldEnterprise,
  GraphicalSchemaFieldXML,
} from "../graphicalSchemaField/types"
import { HTMLDocumentField, HTMLDocumentFieldEnterprise, HTMLDocumentFieldXML } from "../htmlDocumentField/types"
import { InputField, InputFieldEnterprise, InputFieldXML } from "../inputField/types"
import { LabelDecoration, LabelDecorationEnterprise, LabelDecorationXML } from "../labelDecoration/types"
import { LabelField, LabelFieldEnterprise, LabelFieldXML } from "../labelField/types"
import { Page, PageEnterprise, PageXML } from "../page/types"
import { Pages, PagesEnterprise, PagesXML } from "../pages/types"
import { PdfDocumentField, PdfDocumentFieldEnterprise, PdfDocumentFieldXML } from "../pdfDocumentField/types"
import { PeriodField, PeriodFieldEnterprise, PeriodFieldXML } from "../periodField/types"
import { PictureDecoration, PictureDecorationEnterprise, PictureDecorationXML } from "../pictureDecoration/types"
import { PictureField, PictureFieldEnterprise, PictureFieldXML } from "../pictureField/types"
import { PlannerField, PlannerFieldEnterprise, PlannerFieldXML } from "../plannerField/types"
import { Popup, PopupEnterprise, PopupXML } from "../popup/types"
import { ProgressBarField, ProgressBarFieldEnterprise, ProgressBarFieldXML } from "../progressBarField/types"
import { RadioButtonField, RadioButtonFieldEnterprise, RadioButtonFieldXML } from "../radioButtonField/types"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
  SearchControlAdditionXML,
} from "../searchControlAddition/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SearchStringAdditionXML,
} from "../searchStringAddition/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldEnterprise,
  SpreadSheetDocumentFieldXML,
} from "../spreadSheetDocumentField/types"
import { Table, TableEnterprise, TableXML } from "../table/types"
import { TextDocumentField, TextDocumentFieldEnterprise, TextDocumentFieldXML } from "../textDocumentField/types"
import { TrackBarField, TrackBarFieldEnterprise, TrackBarFieldXML } from "../trackBarField/types"
import { UsualGroup, UsualGroupEnterprise, UsualGroupXML } from "../usualGroup/types"
import { ViewStatusAddition, ViewStatusAdditionEnterprise, ViewStatusAdditionXML } from "../viewStatusAddition/types"

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
  | ButtonGroupEnterprise
  | CalendarFieldEnterprise
  | ChartFieldEnterprise
  | CheckBoxFieldEnterprise
  | ColumnGroupEnterprise
  | CommandBarEnterprise
  | DendrogramFieldEnterprise
  | FormattedDocumentFieldEnterprise
  | FormDecorationEnterprise
  | FormFieldEnterprise
  | FormGroupEnterprise
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
  | ColumnGroupEnterprise
  | CommandBarEnterprise
  | DendrogramFieldEnterprise
  | FormattedDocumentFieldEnterprise
  | FormDecorationEnterprise
  | FormFieldEnterprise
  | FormGroupEnterprise
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
