import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, FormElementTypeAll } from "~/metadata/forms/elements/baseElement/types"
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
import { exportPictureFieldContentToNKDK } from "~/metadata/forms/elements/pictureField/toNKDK"
import { exportPopupContentToNKDK } from "~/metadata/forms/elements/popup/toNKDK"
import { exportUsualGroupToNKDK } from "~/metadata/forms/elements/usualGroup/toNKDK"

export interface ToNKDKResult {
  strings: string[]
  toOneLineGroup: boolean
}

export type ExportToNKDKFn = (params: { context: ConfigurationContext; element: BaseElement }) => ToNKDKResult

export type ExportToNKDKFnMap = {
  [K in FormElementTypeAll]?: (params: {
    context: ConfigurationContext
    element: Extract<BaseElement, { itemType: K }>
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
} satisfies ExportToNKDKFnMap

export const ExportToNKDKTableChildItemsGeneratorFn = {
  InputField: exportInputFieldContentToNKDK,
  LabelField: exportLabelFieldContentToNKDK,
  PictureField: exportPictureFieldContentToNKDK,
  ColumnGroup: exportColumnGroupContentToNKDK,
  CheckBoxField: exportCheckBoxFieldContentToNKDK,
} satisfies ExportToNKDKFnMap

export const ExportToNKDKCommandBarChildItemsGeneratorFn = {
  Button: exportButtonContentToNKDK,
  Popup: exportPopupContentToNKDK,
  ButtonGroup: exportButtonGroupContentToNKDK,
} satisfies ExportToNKDKFnMap
