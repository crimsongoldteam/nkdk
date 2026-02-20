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
// export type ToPreviewType<T> = T extends undefined
//   ? undefined
//   : "Preview" extends keyof TypeRules<NonNullable<T>>
//     ? TypeRules<NonNullable<T>>["Preview"]
//     : never

// // #endregion

// #region functions

// export type ImportFromXMLFn = <To extends AllChildItem | undefined>(
//   context: ConfigurationContext,
//   data: ElementXML | undefined
// ) => To

// export type ImportTypedFromYAMLFn = <To extends TypedElement>(
//   context: ConfigurationContext,
//   data: ToTypedYAML<To>,
//   name: string
// ) => To

// export type ImportPartialFromYAMLFn = (
//   context: ConfigurationContext,
//   source: Object,
//   data: Object | undefined
// ) => Object | undefined

// export type ExportToXMLFn = (context: ConfigurationContext, data?: any) => any

// export type ExportPartialToYAMLFn = <From extends BaseElement | undefined>(
//   context: ConfigurationContext,
//   data: From
// ) => ToYAML<From>

// export type ExportTypedToYAMLFn = <From extends TypedElement>(
//   context: ConfigurationContext,
//   data: From
// ) => ToTypedYAML<From>

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

type fnPairs =
  // | ["ExportToXML", ExportToXMLFn]
  // | ["ExportPartialToYAML", ExportPartialToYAMLFn]
  // | ["ExportTypedToYAML", ExportTypedToYAMLFn]
  // | ["ImportFromXML", ImportFromXMLFn]
  // | ["ImportPartialFromYAML", ImportPartialFromYAMLFn]
  // | ["ImportTypedFromYAML", ImportTypedFromYAMLFn]
  ["ExportToStructure", ExportToStructureFn] | ["ExportToStructureContent", ExportToStructureContentFn]
// | ["ExportToPreview", ExportToPreviewFn]

export type ItemOperationType = fnPairs extends infer T ? (T extends [infer Op, any] ? Op : never) : never

export type OperationFunction<Type extends ItemOperationType> = Extract<fnPairs, [Type, any]>[1]
