import { FormButtonType, FormDecorationType, FormFieldType, FormGroupType } from "~/metadata/systemEnumerations/types"
import { FormElementType, MetadataItemRule } from ".."
import { ConfigurationContext } from "../../context/types"
import { BaseElement } from "../../forms/elements/baseElement/types"
import { EventXML } from "../events"
import { ExportToEnterpriseFunction } from "../types/types"
import { ToNKDKResult } from "./toNKDKGenerator/types"

// #region rules

export interface RegisterAsTypeRule<T extends BaseElement> {
  toXML: (context: ConfigurationContext, element: T | undefined) => { id: string; name: string }
}

// export interface ElementRule extends MetadataItemRule {
//   enterpriseField?: "FormField" | "FormDecoration" | "FormTable" | "FormGroup" | "FormButton"
//   enterpriseFieldType:
//     | `FormFieldType.${FormFieldType}`
//     | `FormButtonType.${FormButtonType}`
//     | `FormGroupType.${FormGroupType}`
//     | `FormDecorationType.${FormDecorationType}`
//     | "None"
//   alwaysExportToXML?: true

//   registerAsType?: Partial<Record<TypeRulesNames, RegisterAsTypeRule<BaseElement>>>
// }

export interface ElementRule extends MetadataItemRule {
  itemType: FormElementType
  enterpriseField: "FormField" | "FormDecoration" | "FormTable" | "FormGroup" | "FormButton"
  enterpriseFieldType:
    | `FormFieldType.${FormFieldType}`
    | `FormButtonType.${FormButtonType}`
    | `FormGroupType.${FormGroupType}`
    | `FormDecorationType.${FormDecorationType}`
    | "None"
  alwaysExportToXML?: true

  // registerAsType?: Partial<Record<TypeRulesNames, RegisterAsTypeRule<T>>>
}
// #endregion

// #region xml

export interface ElementXML {
  _name: string
  _id: string
  [key: string]: any
}

export interface EventedXML extends ElementXML {
  Events: EventXML[] | EventXML
}

// #endregion

// #region factory

export type ExportToStructureFn = <From extends BaseElement>(context: ConfigurationContext, data: From) => ToNKDKResult

export type ExportToStructureContentFn = <From extends BaseElement>(
  context: ConfigurationContext,
  data: From
) => ToNKDKResult

export type ImportFromNKDKFn = <To extends BaseElement>(params: { context: ConfigurationContext; source: any }) => To

type fnPairs =
  | ["ExportToStructure", ExportToStructureFn]
  | ["ExportToStructureContent", ExportToStructureContentFn]
  | ["ExportToEnterprise", ExportToEnterpriseFunction]
  | ["ImportFromNKDK", ImportFromNKDKFn]

export type ItemOperationType = fnPairs extends infer T ? (T extends [infer Op, any] ? Op : never) : never

export type OperationFunction<Type extends ItemOperationType> = Extract<fnPairs, [Type, any]>[1]

// #endregion
