import { Button, ButtonXML } from "../button/types"
import { ButtonGroup, ButtonGroupXML } from "../buttonGroup/types"
import { CalendarField, CalendarFieldXML } from "../calendarField/types"
import { ChartField, ChartFieldXML } from "../chartField/types"
import { CheckBoxField, CheckBoxFieldXML } from "../checkBoxField/types"
import { ColumnGroup, ColumnGroupXML } from "../columnGroup/types"
import { CommandBar, CommandBarXML } from "../commandBar/types"
import { DendrogramField } from "../dendrogramField/types"
import { FormattedDocumentField, FormattedDocumentFieldXML } from "../formattedDocumentField/types"
import { FormDecoration } from "../formDecoration/types"
import { FormField, FormFieldXML } from "../formField/types"
import { FormGroup } from "../formGroup/types"
import { FormItemAddition, FormItemAdditionXML } from "../formItemAddition/types"
import { GanttChartField } from "../ganttChartField/types"
import { GeographicalSchemaField, GeographicalSchemaFieldXML } from "../geographicalSchemaField/types"
import { GraphicalSchemaField, GraphicalSchemaFieldXML } from "../graphicalSchemaField/types"
import { HTMLDocumentField } from "../htmlDocumentField/types"
import { InputField, InputFieldXML } from "../inputField/types"
import { LabelDecoration } from "../labelDecoration/types"
import { LabelField, LabelFieldXML } from "../labelField/types"
import { Page } from "../page/types"
import { Pages } from "../pages/types"
import { PdfDocumentField, PdfDocumentFieldXML } from "../pdfDocumentField/types"
import { PeriodField } from "../periodField/types"
import { PictureDecoration } from "../pictureDecoration/types"
import { PictureField, PictureFieldXML } from "../pictureField/types"
import { PlannerField } from "../plannerField/types"
import { Popup } from "../popup/types"
import { ProgressBarField, ProgressBarFieldXML } from "../progressBarField/types"
import { RadioButtonField } from "../radioButtonField/types"
import { SearchControlAddition } from "../searchControlAddition/types"
import { SearchStringAddition, SearchStringAdditionXML } from "../searchStringAddition/types"
import { SpreadSheetDocumentField } from "../spreadSheetDocumentField/types"
import { Table, TableXML } from "../table/types"
import { TextDocumentField } from "../textDocumentField/types"
import { TrackBarField, TrackBarFieldXML } from "../trackBarField/types"
import { UsualGroup } from "../usualGroup/types"
import { ViewStatusAddition, ViewStatusAdditionXML } from "../viewStatusAddition/types"

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
  | DendrogramField
  | FormattedDocumentFieldXML
  | FormDecoration
  | FormFieldXML
  | FormGroup
  | FormItemAdditionXML
  | GanttChartField
  | GeographicalSchemaFieldXML
  | GraphicalSchemaFieldXML
  | HTMLDocumentField
  | InputFieldXML
  | LabelDecoration
  | LabelFieldXML
  | Page
  | Pages
  | PdfDocumentFieldXML
  | PeriodField
  | PictureDecoration
  | PictureFieldXML
  | PlannerField
  | Popup
  | ProgressBarFieldXML
  | RadioButtonField
  | SearchControlAddition
  | SearchStringAdditionXML
  | SpreadSheetDocumentField
  | TableXML
  | TextDocumentField
  | TrackBarFieldXML
  | UsualGroup
  | ViewStatusAdditionXML

export type ChildItemsXML = ChildItemXML[]
