import { ConfigurationContext } from "~/metadata/context/types"
import {
  ExportToNKDKCommandBarChildItemsGeneratorFn,
  ExportToNKDKGeneratorFn,
  ExportToNKDKTableChildItemsGeneratorFn,
  ToNKDKResult,
} from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { CommandBarChildItem, GenerateChildItem, TableChildItem } from "./types"

export const exportChildItemsToNKDK = <From extends GenerateChildItem>(
  context: ConfigurationContext,
  items: From[]
): ToNKDKResult => {
  let toOneLineGroup = true
  let strings: string[] = []
  for (const item of items) {
    const exportFunction = getExportFunction(item.itemType)

    const result = exportFunction({ context, element: item })
    strings.push(...result.strings)

    toOneLineGroup = toOneLineGroup && result.toOneLineGroup
  }
  return { strings, toOneLineGroup }
}

export const exportCommandBarChildItemsToNKDK = (
  context: ConfigurationContext,
  items: CommandBarChildItem[]
): ToNKDKResult => {
  let toOneLineGroup = true
  let strings: string[] = []
  for (const item of items) {
    const exportFunction = ExportToNKDKCommandBarChildItemsGeneratorFn[item.itemType] as (params: {
      context: ConfigurationContext
      element: CommandBarChildItem
    }) => ToNKDKResult

    const result = exportFunction({ context, element: item })
    strings.push(...result.strings)

    toOneLineGroup = toOneLineGroup && result.toOneLineGroup
  }
  return { strings, toOneLineGroup }
}

export const exportTableChildItemsToNKDK = (context: ConfigurationContext, items: TableChildItem[]): ToNKDKResult => {
  let toOneLineGroup = true
  let strings: string[] = []
  for (const item of items) {
    const exportFunction = ExportToNKDKTableChildItemsGeneratorFn[item.itemType] as (params: {
      context: ConfigurationContext
      element: TableChildItem
    }) => ToNKDKResult

    const result = exportFunction({ context, element: item })
    strings.push(...result.strings)

    toOneLineGroup = toOneLineGroup && result.toOneLineGroup
  }
  return { strings, toOneLineGroup }
}

const getExportFunction = <T extends GenerateChildItem["itemType"]>(
  itemType: T
): ((params: { context: ConfigurationContext; element: GenerateChildItem }) => ToNKDKResult) => {
  return ExportToNKDKGeneratorFn[itemType] as (params: {
    context: ConfigurationContext
    element: GenerateChildItem
  }) => ToNKDKResult
}
