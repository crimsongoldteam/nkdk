import z from "zod"
import { ZButton, ZButtonXML } from "../button/types"
import { ZButtonGroup, ZButtonGroupXML } from "../buttonGroup/types"
import { ZCalendarField, ZCalendarFieldXML } from "../calendarField/types"
import { ZChartField, ZChartFieldXML } from "../chartField/types"
import { ZCheckBoxField, ZCheckBoxFieldXML } from "../checkBoxField/types"
import { ZColumnGroup, ZColumnGroupXML } from "../columnGroup/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZDendrogramField, ZDendrogramFieldXML } from "../dendrogramField/types"
import {
  ZFormattedDocumentField,
  ZFormattedDocumentFieldXML,
} from "../formattedDocumentField/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZFormItemAddition, ZFormItemAdditionXML } from "../formItemAddition/types"
import { ZGanttChartField, ZGanttChartFieldXML } from "../ganttChartField/types"
import {
  ZGeographicalSchemaField,
  ZGeographicalSchemaFieldXML,
} from "../geographicalSchemaField/types"
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
import {
  ZSpreadSheetDocumentField,
  ZSpreadSheetDocumentFieldXML,
} from "../spreadSheetDocumentField/types"
import { ZTable, ZTableXML } from "../table/types"
import { ZTextDocumentField, ZTextDocumentFieldXML } from "../textDocumentField/types"
import { ZTrackBarField, ZTrackBarFieldXML } from "../trackBarField/types"
import { ZUsualGroup, ZUsualGroupXML } from "../usualGroup/types"
import { ZViewStatusAddition, ZViewStatusAdditionXML } from "../viewStatusAddition/types"

export const ZChildItem = z.discriminatedUnion("elementType", [
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
])

export const ZChildItems = z.array(ZChildItem)

export const ZChildItemXML = z.object({
  get Button() {
    return ZButtonXML.optional()
  },
  get ButtonGroup() {
    return ZButtonGroupXML.optional()
  },
  get CalendarField() {
    return ZCalendarFieldXML.optional()
  },
  get ChartField() {
    return ZChartFieldXML.optional()
  },
  get CheckBoxField() {
    return ZCheckBoxFieldXML.optional()
  },
  get ColumnGroup() {
    return ZColumnGroupXML.optional()
  },
  get CommandBar() {
    return ZCommandBarXML.optional()
  },
  get DendrogramField() {
    return ZDendrogramFieldXML.optional()
  },
  get FormattedDocumentField() {
    return ZFormattedDocumentFieldXML.optional()
  },
  get FormDecoration() {
    return ZFormDecorationXML.optional()
  },
  get FormField() {
    return ZFormFieldXML.optional()
  },
  get FormItemAddition() {
    return ZFormItemAdditionXML.optional()
  },
  get GanttChartField() {
    return ZGanttChartFieldXML.optional()
  },
  get GeographicalSchemaField() {
    return ZGeographicalSchemaFieldXML.optional()
  },
  get GraphicalSchemaField() {
    return ZGraphicalSchemaFieldXML.optional()
  },
  get HTMLDocumentField() {
    return ZHTMLDocumentFieldXML.optional()
  },
  get InputField() {
    return ZInputFieldXML.optional()
  },
  get LabelDecoration() {
    return ZLabelDecorationXML.optional()
  },
  get LabelField() {
    return ZLabelFieldXML.optional()
  },
  get Page() {
    return ZPageXML.optional()
  },
  get Pages() {
    return ZPagesXML.optional()
  },
  get PdfDocumentField() {
    return ZPdfDocumentFieldXML.optional()
  },
  get PeriodField() {
    return ZPeriodFieldXML.optional()
  },
  get PictureDecoration() {
    return ZPictureDecorationXML.optional()
  },
  get PictureField() {
    return ZPictureFieldXML.optional()
  },
  get PlannerField() {
    return ZPlannerFieldXML.optional()
  },
  get Popup() {
    return ZPopupXML.optional()
  },
  get ProgressBarField() {
    return ZProgressBarFieldXML.optional()
  },
  get RadioButtonField() {
    return ZRadioButtonFieldXML.optional()
  },
  get SearchControlAddition() {
    return ZSearchControlAdditionXML.optional()
  },
  get SearchStringAddition() {
    return ZSearchStringAdditionXML.optional()
  },
  get SpreadSheetDocumentField() {
    return ZSpreadSheetDocumentFieldXML.optional()
  },
  get Table() {
    return ZTableXML.optional()
  },
  get TextDocumentField() {
    return ZTextDocumentFieldXML.optional()
  },
  get TrackBarField() {
    return ZTrackBarFieldXML.optional()
  },
  get UsualGroup() {
    return ZUsualGroupXML.optional()
  },
  get ViewStatusAddition() {
    return ZViewStatusAdditionXML.optional()
  },
  get FormGroup() {
    return ZFormGroupXML.optional()
  },
})

export const ZChildItemsXML = z.array(ZChildItemXML)

export type TChildItemXML = z.infer<typeof ZChildItemXML>
export type TChildItemsXML = z.infer<typeof ZChildItemsXML>

export type TChildItem = z.infer<typeof ZChildItem>
export type TChildItems = z.infer<typeof ZChildItems>
