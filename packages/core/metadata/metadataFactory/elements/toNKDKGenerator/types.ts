import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, FormElementTypeAll } from "~/metadata/forms/elements/baseElement/types"
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
} satisfies ExportToNKDKFnMap
