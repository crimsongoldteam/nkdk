// // #region type associations

import { ConfigurationContext } from "../context/types"
import { BaseElement } from "../forms/elements/baseElement/types"
import { IFormatElementResult } from "../forms/format/types"
import { EventXML } from "./events"

export interface ElementXML {
  _name: string
  _id: string
  [key: string]: any
}

export interface EventedXML extends ElementXML {
  Events: EventXML[] | EventXML
}

export type ExportToStructureFn = <From extends BaseElement>(
  context: ConfigurationContext,
  data: From
) => IFormatElementResult

export type ExportToStructureContentFn = <From extends BaseElement>(
  context: ConfigurationContext,
  data: From
) => IFormatElementResult

// export type ExportToPreviewFn = <From extends BaseElement>(
//   context: ConfigurationContext,
//   data: From
// ) => NonNullable<ToPreviewType<From>>

// #endregion

type fnPairs = ["ExportToStructure", ExportToStructureFn] | ["ExportToStructureContent", ExportToStructureContentFn]

export type ItemOperationType = fnPairs extends infer T ? (T extends [infer Op, any] ? Op : never) : never

export type OperationFunction<Type extends ItemOperationType> = Extract<fnPairs, [Type, any]>[1]
