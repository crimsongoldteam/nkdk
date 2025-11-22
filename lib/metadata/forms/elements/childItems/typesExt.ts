import z from "~/node_modules/zod/v4/classic/external.cjs"
import { ZButton } from "../button/types"
import { ZButtonGroup } from "../buttonGroup/types"
import { ZCalendarField } from "../calendarField/types"
import { ZChartField } from "../chartField/types"
import { ZCheckBoxField } from "../checkBoxField/types"
import { ZColumnGroup } from "../columnGroup/types"
import { ZCommandBar } from "../commandBar/types"
import { ZDendrogramField } from "../dendrogramField/types"
import { ZFormattedDocumentField } from "../formattedDocumentField/types"
import { ZFormDecoration } from "../formDecoration/types"
import { ZFormField } from "../formField/types"
import { ZFormGroup } from "../formGroup/types"
import { ZFormItemAddition } from "../formItemAddition/types"
import { ZGanttChartField } from "../ganttChartField/types"
import { ZGeographicalSchemaField } from "../geographicalSchemaField/types"
import { ZGraphicalSchemaField } from "../graphicalSchemaField/types"
import { ZHTMLDocumentField } from "../htmlDocumentField/types"
import { ZInputField } from "../inputField/types"
import { ZLabelDecoration } from "../labelDecoration/types"
import { ZLabelField } from "../labelField/types"
import { ZPage } from "../page/types"
import { ZPages } from "../pages/types"
import { ZPdfDocumentField } from "../pdfDocumentField/types"
import { ZPeriodField } from "../periodField/types"
import { ZPictureDecoration } from "../pictureDecoration/types"
import { ZPictureField } from "../pictureField/types"
import { ZPlannerField } from "../plannerField/types"
import { ZPopup } from "../popup/types"
import { ZProgressBarField } from "../progressBarField/types"
import { ZRadioButtonField } from "../radioButtonField/types"
import { ZSearchControlAddition } from "../searchControlAddition/types"
import { ZSearchStringAddition } from "../searchStringAddition/types"
import { ZSpreadSheetDocumentField } from "../spreadSheetDocumentField/types"
import { ZTable } from "../table/types"
import { ZTextDocumentField } from "../textDocumentField/types"
import { ZTrackBarField } from "../trackBarField/types"
import { ZUsualGroup } from "../usualGroup/types"
import { ZViewStatusAddition } from "../viewStatusAddition/types"

const ZChildItemUnion = z.union([
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

const ZChildItemsUnion = z.array(ZChildItemUnion)

export type TChildItems = z.infer<typeof ZChildItemsUnion>
