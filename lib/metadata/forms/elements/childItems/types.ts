import z from "zod"
import { ZBaseElement, ZBaseElementXML } from "../baseElement/types"
import { ZButton, ZButtonXML } from "../button/types"
import { ZButtonGroup, ZButtonGroupXML } from "../buttonGroup/types"
import { ZCalendarField, ZCalendarFieldXML } from "../calendarField/types"
import { ZChartField, ZChartFieldXML } from "../chartField/types"
import { ZCheckBoxField, ZCheckBoxFieldXML } from "../checkBoxField/types"
import { ZColumnGroup, ZColumnGroupXML } from "../columnGroup/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZDendrogramField, ZDendrogramFieldXML } from "../dendrogramField/types"
import { ZFormattedDocumentField, ZFormattedDocumentFieldXML } from "../formattedDocumentField/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZFormItemAddition, ZFormItemAdditionXML } from "../formItemAddition/types"
import { ZGanttChartField, ZGanttChartFieldXML } from "../ganttChartField/types"
import { ZGeographicalSchemaField, ZGeographicalSchemaFieldXML } from "../geographicalSchemaField/types"
import { ZGraphicalSchemaField, ZGraphicalSchemaFieldXML } from "../graphicalSchemaField/types"
import { ZHTMLDocumentField, ZHTMLDocumentFieldXML } from "../htmlDocumentField/types"
import { ZInputField, ZInputFieldXML } from "../inputField/types"
import { ZLabelDecoration, ZLabelDecorationXML } from "../labelDecoration/types"
import { ZLabelField, ZLabelFieldXML } from "../labelField/types"
import { ZPage, ZPageXML } from "../page/types"
import { ZPages, ZPagesXML } from "../pages/types"
import { ZPdfDocumentField, ZPdfDocumentFieldXML } from "../pdfDocumentField/types"
import { ZPeriodField, ZPeriodFieldXML } from "../periodField/types"
import { ZPictureDecoration, ZPictureDecorationXML } from "../pictureDecoration/types"
import { ZPictureField, ZPictureFieldXML } from "../pictureField/types"
import { ZPlannerField, ZPlannerFieldXML } from "../plannerField/types"
import { ZPopup, ZPopupXML } from "../popup/types"
import { ZProgressBarField, ZProgressBarFieldXML } from "../progressBarField/types"
import { ZRadioButtonField, ZRadioButtonFieldXML } from "../radioButtonField/types"
import { ZSearchControlAddition, ZSearchControlAdditionXML } from "../searchControlAddition/types"
import { ZSearchStringAddition, ZSearchStringAdditionXML } from "../searchStringAddition/types"
import { ZSpreadSheetDocumentField, ZSpreadSheetDocumentFieldXML } from "../spreadSheetDocumentField/types"
import { ZTable, ZTableXML } from "../table/types"
import { ZTextDocumentField, ZTextDocumentFieldXML } from "../textDocumentField/types"
import { ZTrackBarField, ZTrackBarFieldXML } from "../trackBarField/types"
import { ZUsualGroup, ZUsualGroupXML } from "../usualGroup/types"
import { ZViewStatusAddition, ZViewStatusAdditionXML } from "../viewStatusAddition/types"

const ZChildItem = z.union([
  ZButton,
  ZButtonGroup,
  ZCalendarField,
  ZChartField,
  ZCheckBoxField,
  ZColumnGroup,
  ZCommandBar,
  ZDendrogramField,
  ZFormattedDocumentField,
  ZFormDecoration,
  ZFormField,
  ZFormGroup,
  ZFormItemAddition,
  ZGanttChartField,
  ZGeographicalSchemaField,
  ZGraphicalSchemaField,
  ZHTMLDocumentField,
  ZInputField,
  ZLabelDecoration,
  ZLabelField,
  ZPage,
  ZPages,
  ZPdfDocumentField,
  ZPeriodField,
  ZPictureDecoration,
  ZPictureField,
  ZPlannerField,
  ZPopup,
  ZProgressBarField,
  ZRadioButtonField,
  ZSearchControlAddition,
  ZSearchStringAddition,
  ZSpreadSheetDocumentField,
  ZTable,
  ZTextDocumentField,
  ZTrackBarField,
  ZUsualGroup,
  ZViewStatusAddition,
  ZBaseElement,
])

export type TChildItem = z.infer<typeof ZChildItem>

export const ZChildItems = z.array(ZChildItem)

export const ZChildItemXML = z.object({
  Button: ZButtonXML.optional(),
  ButtonGroup: ZButtonGroupXML.optional(),
  CalendarField: ZCalendarFieldXML.optional(),
  ChartField: ZChartFieldXML.optional(),
  CheckBoxField: ZCheckBoxFieldXML.optional(),
  ColumnGroup: ZColumnGroupXML.optional(),
  CommandBar: ZCommandBarXML.optional(),
  DendrogramField: ZDendrogramFieldXML.optional(),
  FormattedDocumentField: ZFormattedDocumentFieldXML.optional(),
  FormDecoration: ZFormDecorationXML.optional(),
  FormField: ZFormFieldXML.optional(),
  FormItemAddition: ZFormItemAdditionXML.optional(),
  GanttChartField: ZGanttChartFieldXML.optional(),
  GeographicalSchemaField: ZGeographicalSchemaFieldXML.optional(),
  GraphicalSchemaField: ZGraphicalSchemaFieldXML.optional(),
  HTMLDocumentField: ZHTMLDocumentFieldXML.optional(),
  InputField: ZInputFieldXML.optional(),
  LabelDecoration: ZLabelDecorationXML.optional(),
  LabelField: ZLabelFieldXML.optional(),
  Page: ZPageXML.optional(),
  Pages: ZPagesXML.optional(),
  PdfDocumentField: ZPdfDocumentFieldXML.optional(),
  PeriodField: ZPeriodFieldXML.optional(),
  PictureDecoration: ZPictureDecorationXML.optional(),
  PictureField: ZPictureFieldXML.optional(),
  PlannerField: ZPlannerFieldXML.optional(),
  Popup: ZPopupXML.optional(),
  ProgressBarField: ZProgressBarFieldXML.optional(),
  RadioButtonField: ZRadioButtonFieldXML.optional(),
  SearchControlAddition: ZSearchControlAdditionXML.optional(),
  SearchStringAddition: ZSearchStringAdditionXML.optional(),
  SpreadSheetDocumentField: ZSpreadSheetDocumentFieldXML.optional(),
  Table: ZTableXML.optional(),
  TextDocumentField: ZTextDocumentFieldXML.optional(),
  TrackBarField: ZTrackBarFieldXML.optional(),
  UsualGroup: ZUsualGroupXML.optional(),
  ViewStatusAddition: ZViewStatusAdditionXML.optional(),
})

export const ZChildItemsXML = z.array(ZChildItemXML)

export type TChildItems = z.infer<typeof ZChildItems>

export type TChildItemXML = z.infer<typeof ZChildItemXML>
export type TChildItemsXML = z.infer<typeof ZChildItemsXML>
