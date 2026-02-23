import { ConfigurationContext } from "~/metadata/context/types"
import {
  ExportToNKDKContentGeneratorFn,
  ExportToNKDKGeneratorFn,
  ToNKDKResult,
} from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { exportOtherElementToNKDK } from "../../elements/baseElement/exportToStructure"
import { FormElementTypeAll } from "../../elements/baseElement/types"
import { AllChildItem, CommandBarChildItem, TableChildItem } from "./types"

export const exportChildItemsToNKDK = <From extends AllChildItem>(
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

export const exportChildItemsContentToNKDK = <From extends TableChildItem | CommandBarChildItem>(
  context: ConfigurationContext,
  items: From[]
): ToNKDKResult => {
  let toOneLineGroup = true
  let strings: string[] = []
  for (const item of items) {
    const exportFunction = ExportToNKDKContentGeneratorFn[item.itemType as keyof typeof ExportToNKDKContentGeneratorFn]

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
