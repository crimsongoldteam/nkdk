import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBarChildItem, GenerateChildItem, TableChildItem } from "~/metadata/forms/commonObjects/childItems/types"
import { exportOtherElementToNKDK } from "~/metadata/forms/elements/baseElement/toNKDK"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import {
  exportButtonContentToNKDK,
  exportButtonToNKDK,
  exportCommandBarButtonToNKDK,
} from "~/metadata/forms/elements/button/toNKDK"
import { exportButtonGroupContentToNKDK } from "~/metadata/forms/elements/buttonGroup/toNKDK"
import {
  exportCheckBoxFieldToNKDK,
  exportTableCheckBoxFieldContentToNKDK,
} from "~/metadata/forms/elements/checkBoxField/toNKDK"
import { exportColumnGroupContentToNKDK } from "~/metadata/forms/elements/columnGroup/toNKDK"
import { exportCommandBarToNKDK } from "~/metadata/forms/elements/commandBar/toNKDK"
import { exportInputFieldToNKDK, exportTableInputFieldContentToNKDK } from "~/metadata/forms/elements/inputField/toNKDK"
import { exportLabelDecorationToNKDK } from "~/metadata/forms/elements/labelDecoration/toNKDK"
import { exportLabelFieldToNKDK, exportTableLabelFieldContentToNKDK } from "~/metadata/forms/elements/labelField/toNKDK"
import { exportPageToNKDK } from "~/metadata/forms/elements/page/toNKDK"
import { exportPagesToNKDK } from "~/metadata/forms/elements/pages/toNKDK"
import { exportPictureDecorationToNKDK } from "~/metadata/forms/elements/pictureDecoration/toNKDK"
import { exportTablePictureFieldContentToNKDK } from "~/metadata/forms/elements/pictureField/toNKDK"
import { exportPopupContentToNKDK } from "~/metadata/forms/elements/popup/toNKDK"
import { exportTableToNKDK } from "~/metadata/forms/elements/table/toNKDK"
import { exportUsualGroupToNKDK } from "~/metadata/forms/elements/usualGroup/toNKDK"

export interface ToNKDKResult {
  strings: string[]
  toOneLineGroup: boolean
}

// export type ExportToNKDKFn = (params: { context: ConfigurationContext; element: BaseElement }) => ToNKDKResult

export type ExportToNKDKFnMap<T extends { itemType: string } = BaseElement> = {
  [K in T["itemType"]]: (params: {
    context: ConfigurationContext
    element: Extract<T, { itemType: K }>
  }) => ToNKDKResult
}

function getExportCommandBarToNKDK() {
  return exportCommandBarToNKDK
}

export const ExportToNKDKGeneratorFn: ExportToNKDKFnMap<GenerateChildItem> = {
  Button: exportButtonToNKDK,
  UsualGroup: exportUsualGroupToNKDK,
  InputField: exportInputFieldToNKDK,
  LabelField: exportLabelFieldToNKDK,
  LabelDecoration: exportLabelDecorationToNKDK,
  Page: exportPageToNKDK,
  Pages: exportPagesToNKDK,
  CheckBoxField: exportCheckBoxFieldToNKDK,
  get CommandBar() {
    return getExportCommandBarToNKDK()
  },
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
  SearchControlAddition: exportOtherElementToNKDK,
  SearchStringAddition: exportOtherElementToNKDK,
  SpreadSheetDocumentField: exportOtherElementToNKDK,
  Table: exportTableToNKDK,
  TextDocumentField: exportOtherElementToNKDK,
  TrackBarField: exportOtherElementToNKDK,
  ViewStatusAddition: exportOtherElementToNKDK,
} as const satisfies ExportToNKDKFnMap<GenerateChildItem>

/** Тип функции экспорта для конкретного itemType */
export type ExportToNKDKGeneratorFnFor<K extends GenerateChildItem["itemType"]> = (typeof ExportToNKDKGeneratorFn)[K]

export const ExportToNKDKTableChildItemsGeneratorFn = {
  TableInputField: exportTableInputFieldContentToNKDK,
  TableLabelField: exportTableLabelFieldContentToNKDK,
  TablePictureField: exportTablePictureFieldContentToNKDK,
  ColumnGroup: exportColumnGroupContentToNKDK,
  TableCheckBoxField: exportTableCheckBoxFieldContentToNKDK,
} as const satisfies ExportToNKDKFnMap<TableChildItem>

export const ExportToNKDKCommandBarChildItemsGeneratorFn = {
  Button: exportButtonContentToNKDK,
  CommandBarButton: exportCommandBarButtonToNKDK,
  Popup: exportPopupContentToNKDK,
  ButtonGroup: exportButtonGroupContentToNKDK,
  SearchStringAddition: exportOtherElementToNKDK,
  SearchControlAddition: exportOtherElementToNKDK,
  ViewStatusAddition: exportOtherElementToNKDK,
} as const satisfies ExportToNKDKFnMap<CommandBarChildItem>
