import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { ExportToEnterpriseFunction } from "../property/fn"

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
