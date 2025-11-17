import z from "zod"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZFormField, ZFormFieldXML } from "../formField/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import {
  ZFormItemAddition,
  ZFormItemAdditionXML,
} from "../formItemAddition/types"
import { ZButton, ZButtonXML } from "../button/types"
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
import { ZGanttChartField, ZGanttChartFieldXML } from "../ganttChartField/types"
import {
  ZGeographicalSchemaField,
  ZGeographicalSchemaFieldXML,
} from "../geographicalSchemaField/types"
import {
  ZGraphicalSchemaField,
  ZGraphicalSchemaFieldXML,
} from "../graphicalSchemaField/types"
import {
  ZHTMLDocumentField,
  ZHTMLDocumentFieldXML,
} from "../htmlDocumentField/types"
import { ZInputField, ZInputFieldXML } from "../inputField/types"
import { ZLabelDecoration, ZLabelDecorationXML } from "../labelDecoration/types"
import { ZLabelField, ZLabelFieldXML } from "../labelField/types"
import { ZPage, ZPageXML } from "../page/types"
import { ZPages, ZPagesXML } from "../pages/types"
import {
  ZPdfDocumentField,
  ZPdfDocumentFieldXML,
} from "../pdfDocumentField/types"
import { ZPeriodField, ZPeriodFieldXML } from "../periodField/types"
import {
  ZPictureDecoration,
  ZPictureDecorationXML,
} from "../pictureDecoration/types"
import { ZPictureField, ZPictureFieldXML } from "../pictureField/types"
import { ZPlannerField, ZPlannerFieldXML } from "../plannerField/types"
import { ZPopup, ZPopupXML } from "../popup/types"
import {
  ZProgressBarField,
  ZProgressBarFieldXML,
} from "../progressBarField/types"
import {
  ZRadioButtonField,
  ZRadioButtonFieldXML,
} from "../radioButtonField/types"
import {
  ZSearchControlAddition,
  ZSearchControlAdditionXML,
} from "../searchControlAddition/types"
import {
  ZSearchStringAddition,
  ZSearchStringAdditionXML,
} from "../searchStringAddition/types"
import {
  ZSpreadSheetDocumentField,
  ZSpreadSheetDocumentFieldXML,
} from "../spreadSheetDocumentField/types"
import { ZTable, ZTableXML } from "../table/types"
import {
  ZTextDocumentField,
  ZTextDocumentFieldXML,
} from "../textDocumentField/types"
import { ZTrackBarField, ZTrackBarFieldXML } from "../trackBarField/types"
import { ZUsualGroup, ZUsualGroupXML } from "../usualGroup/types"
import {
  ZViewStatusAddition,
  ZViewStatusAdditionXML,
} from "../viewStatusAddition/types"
import { ZButtonGroup, ZButtonGroupXML } from "../buttonGroup/types"

export const ZChildItems = z.array(
  z.union([
    z.lazy(() => ZButton),
    z.lazy(() => ZButtonGroup),
    z.lazy(() => ZCalendarField),
    z.lazy(() => ZChartField),
    z.lazy(() => ZCheckBoxField),
    z.lazy(() => ZColumnGroup),
    z.lazy(() => ZCommandBar),
    z.lazy(() => ZDendrogramField),
    z.lazy(() => ZFormattedDocumentField),
    z.lazy(() => ZFormDecoration),
    z.lazy(() => ZFormField),
    z.lazy(() => ZFormGroup),
    z.lazy(() => ZFormItemAddition),
    z.lazy(() => ZGanttChartField),
    z.lazy(() => ZGeographicalSchemaField),
    z.lazy(() => ZGraphicalSchemaField),
    z.lazy(() => ZHTMLDocumentField),
    z.lazy(() => ZInputField),
    z.lazy(() => ZLabelDecoration),
    z.lazy(() => ZLabelField),
    z.lazy(() => ZPage),
    z.lazy(() => ZPages),
    z.lazy(() => ZPdfDocumentField),
    z.lazy(() => ZPeriodField),
    z.lazy(() => ZPictureDecoration),
    z.lazy(() => ZPictureField),
    z.lazy(() => ZPlannerField),
    z.lazy(() => ZPopup),
    z.lazy(() => ZProgressBarField),
    z.lazy(() => ZRadioButtonField),
    z.lazy(() => ZSearchControlAddition),
    z.lazy(() => ZSearchStringAddition),
    z.lazy(() => ZSpreadSheetDocumentField),
    z.lazy(() => ZTable),
    z.lazy(() => ZTextDocumentField),
    z.lazy(() => ZTrackBarField),
    z.lazy(() => ZUsualGroup),
    z.lazy(() => ZViewStatusAddition),
  ] as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]])
)

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

// export type TChildItems = z.infer<typeof ZChildItems>

export type TChildItemXML = z.infer<typeof ZChildItemXML>
export type TChildItemsXML = z.infer<typeof ZChildItemsXML>
