import { ConfigurationContext } from "~/metadata/context/types"
import {
  ExportToNKDKCommandBarChildItemsGeneratorFn,
  ExportToNKDKGeneratorFn,
  ExportToNKDKTableChildItemsGeneratorFn,
  ToNKDKResult,
} from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { exportOtherElementToNKDK } from "../../elements/baseElement/exportToStructure"
import { FormElementTypeAll } from "../../elements/baseElement/types"
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
    const exportFunction =
      ExportToNKDKCommandBarChildItemsGeneratorFn[
        item.itemType as keyof typeof ExportToNKDKCommandBarChildItemsGeneratorFn
      ]

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
    const exportFunction =
      ExportToNKDKTableChildItemsGeneratorFn[item.itemType as keyof typeof ExportToNKDKTableChildItemsGeneratorFn]

    const result = exportFunction({ context, element: item })
    strings.push(...result.strings)

    toOneLineGroup = toOneLineGroup && result.toOneLineGroup
  }
  return { strings, toOneLineGroup }
}

const getExportFunction = (itemType: FormElementTypeAll) => {
  if (itemType in ExportToNKDKGeneratorFn) {
    return ExportToNKDKGeneratorFn[itemType as keyof typeof ExportToNKDKGeneratorFn]
  }
  return exportOtherElementToNKDK
}
