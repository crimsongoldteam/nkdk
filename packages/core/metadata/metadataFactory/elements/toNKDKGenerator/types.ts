import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBarChildItem, GenerateChildItem, TableChildItem } from "~/metadata/forms/commonObjects/childItems/types"
import { exportOtherElementToNKDK } from "~/metadata/forms/elements/baseElement/exportToStructure"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { exportButtonContentToNKDK, exportButtonToNKDK } from "~/metadata/forms/elements/button/toNKDK"
import { exportButtonGroupContentToNKDK } from "~/metadata/forms/elements/buttonGroup/toNKDK"
import {
  exportCheckBoxFieldContentToNKDK,
  exportCheckBoxFieldToNKDK,
} from "~/metadata/forms/elements/checkBoxField/toNKDK"
import { exportColumnGroupContentToNKDK } from "~/metadata/forms/elements/columnGroup/toNKDK"
import { exportCommandBarToNKDK } from "~/metadata/forms/elements/commandBar/toNKDK"
import { exportInputFieldContentToNKDK, exportInputFieldToNKDK } from "~/metadata/forms/elements/inputField/toNKDK"
import { exportLabelDecorationToNKDK } from "~/metadata/forms/elements/labelDecoration/toNKDK"
import { exportLabelFieldContentToNKDK, exportLabelFieldToNKDK } from "~/metadata/forms/elements/labelField/toNKDK"
import { exportPageToNKDK } from "~/metadata/forms/elements/page/toNKDK"
import { exportPagesToNKDK } from "~/metadata/forms/elements/pages/toNKDK"
import { exportPictureDecorationToNKDK } from "~/metadata/forms/elements/pictureDecoration/toNKDK"
import { exportPictureFieldContentToNKDK } from "~/metadata/forms/elements/pictureField/toNKDK"
import { exportPopupContentToNKDK } from "~/metadata/forms/elements/popup/toNKDK"
import { exportTableToNKDK } from "~/metadata/forms/elements/table/toNKDK"
import { exportUsualGroupToNKDK } from "~/metadata/forms/elements/usualGroup/toNKDK"

export interface ToNKDKResult {
  strings: string[]
  toOneLineGroup: boolean
}

export type ExportToNKDKFn = (params: { context: ConfigurationContext; element: BaseElement }) => ToNKDKResult

export type ExportToNKDKFnMap<T extends { itemType: string } = BaseElement> = {
  [K in T["itemType"]]: (params: {
    context: ConfigurationContext
    element: Extract<T, { itemType: K }>
  }) => ToNKDKResult
}

export const ExportToNKDKGeneratorFn = {
  Button: exportButtonToNKDK,
  UsualGroup: exportUsualGroupToNKDK,
  InputField: exportInputFieldToNKDK,
  LabelField: exportLabelFieldToNKDK,
  LabelDecoration: exportLabelDecorationToNKDK,
  Page: exportPageToNKDK,
  Pages: exportPagesToNKDK,
  CheckBoxField: exportCheckBoxFieldToNKDK,
  CommandBar: exportCommandBarToNKDK,
  CalendarField: exportOtherElementToNKDK,
  ChartField: exportOtherElementToNKDK,
  DendrogramField: exportOtherElementToNKDK,
  FormattedDocumentField: exportOtherElementToNKDK,
  GanttChartField: exportOtherElementToNKDK,
  GeographicalSchemaField: exportOtherElementToNKDK,
  GraphicalSchemaField: exportOtherElementToNKDK,
  HTMLDocumentField: exportOtherElementToNKDK,
  PDFDocumentField: exportOtherElementToNKDK,
  PeriodField: exportOtherElementToNKDK,
  PictureDecoration: exportPictureDecorationToNKDK,
  PictureField: exportOtherElementToNKDK,
  PlannerField: exportOtherElementToNKDK,
  ProgressBarField: exportOtherElementToNKDK,
  RadioButtonField: exportOtherElementToNKDK,
  SpreadSheetDocumentField: exportOtherElementToNKDK,
  Table: exportTableToNKDK,
  TextDocumentField: exportOtherElementToNKDK,
  TrackBarField: exportOtherElementToNKDK,
} satisfies ExportToNKDKFnMap<GenerateChildItem>

export const ExportToNKDKTableChildItemsGeneratorFn = {
  InputField: exportInputFieldContentToNKDK,
  LabelField: exportLabelFieldContentToNKDK,
  PictureField: exportPictureFieldContentToNKDK,
  ColumnGroup: exportColumnGroupContentToNKDK,
  CheckBoxField: exportCheckBoxFieldContentToNKDK,
} satisfies ExportToNKDKFnMap<TableChildItem>

export const ExportToNKDKCommandBarChildItemsGeneratorFn = {
  Button: exportButtonContentToNKDK,
  Popup: exportPopupContentToNKDK,
  ButtonGroup: exportButtonGroupContentToNKDK,
  SearchStringAddition: exportOtherElementToNKDK,
  SearchControlAddition: exportOtherElementToNKDK,
} satisfies ExportToNKDKFnMap<CommandBarChildItem>
