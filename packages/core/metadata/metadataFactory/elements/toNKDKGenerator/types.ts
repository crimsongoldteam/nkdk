import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, FormElementTypeAll } from "~/metadata/forms/elements/baseElement/types"
import { exportInputFieldToNKDK } from "~/metadata/forms/elements/inputField/toNKDK"
import { exportLabelDecorationToNKDK } from "~/metadata/forms/elements/labelDecoration/toNKDK"
import { exportPageToNKDK } from "~/metadata/forms/elements/page/toNKDK"
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
} satisfies ExportToNKDKFnMap
