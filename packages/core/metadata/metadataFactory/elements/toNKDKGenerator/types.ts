import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, FormElementTypeAll } from "~/metadata/forms/elements/baseElement/types"
import {
  exportCheckBoxFieldContentToNKDK,
  exportCheckBoxFieldToNKDK,
} from "~/metadata/forms/elements/checkBoxField/toNKDK"
import { exportColumnGroupContentToNKDK } from "~/metadata/forms/elements/columnGroup/toNKDK"
import { exportInputFieldContentToNKDK, exportInputFieldToNKDK } from "~/metadata/forms/elements/inputField/toNKDK"
import { exportLabelDecorationToNKDK } from "~/metadata/forms/elements/labelDecoration/toNKDK"
import { exportPageToNKDK } from "~/metadata/forms/elements/page/toNKDK"
import { exportPagesToNKDK } from "~/metadata/forms/elements/pages/toNKDK"
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
  UsualGroup: exportUsualGroupToNKDK,
  InputField: exportInputFieldToNKDK,
  LabelDecoration: exportLabelDecorationToNKDK,
  Page: exportPageToNKDK,
  Pages: exportPagesToNKDK,
  CheckBoxField: exportCheckBoxFieldToNKDK,
} satisfies ExportToNKDKFnMap

export const ExportToNKDKContentGeneratorFn = {
  InputField: exportInputFieldContentToNKDK,
  ColumnGroup: exportColumnGroupContentToNKDK,
  CheckBoxField: exportCheckBoxFieldContentToNKDK,
} satisfies ExportToNKDKFnMap
