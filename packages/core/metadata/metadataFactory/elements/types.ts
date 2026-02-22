import { IFormatElementResult } from "~/metadata/forms/format/types"
import { MetadataItemRule } from ".."
import { ConfigurationContext } from "../../context/types"
import { BaseElement } from "../../forms/elements/baseElement/types"
import { EventXML } from "../events"
import { ExportToEnterpriseFunction, TypeRulesNames } from "../types/types"

// #region rules

export interface RegisterAsTypeRule<T extends BaseElement> {
  toXML: (context: ConfigurationContext, element: T | undefined) => { id: string; name: string }
}

export interface ElementRule<T extends BaseElement, ExtraProperties extends string = never> extends MetadataItemRule<
  T,
  ExtraProperties
> {
  enterpriseField?: "FormField" | "FormDecoration" | "FormTable" | "FormGroup" | "FormButton"
  alwaysExportToXML?: true

  registerAsType?: Partial<Record<TypeRulesNames, RegisterAsTypeRule<T>>>
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

export type ExportToStructureFn = <From extends BaseElement>(
  context: ConfigurationContext,
  data: From
) => IFormatElementResult

export type ExportToStructureContentFn = <From extends BaseElement>(
  context: ConfigurationContext,
  data: From
) => IFormatElementResult

export type ImportFromNKDKFn = <To extends BaseElement>(params: { context: ConfigurationContext; source: any }) => To

type fnPairs =
  | ["ExportToStructure", ExportToStructureFn]
  | ["ExportToStructureContent", ExportToStructureContentFn]
  | ["ExportToEnterprise", ExportToEnterpriseFunction]
  | ["ImportFromNKDK", ImportFromNKDKFn]

export type ItemOperationType = fnPairs extends infer T ? (T extends [infer Op, any] ? Op : never) : never

export type OperationFunction<Type extends ItemOperationType> = Extract<fnPairs, [Type, any]>[1]

// #endregion
