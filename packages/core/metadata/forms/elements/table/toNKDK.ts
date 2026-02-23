import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { TableColumnSeparator } from "~/nkdk/terminal"
import { exportChildItemsContentToNKDK } from "../../commonObjects/childItems/toNKDK"
import { exportAutoCommandBarToNKDK } from "../autoCommandBar/toNKDK"
import { Table } from "./types"

export const exportTableToNKDK = (params: { context: ConfigurationContext; element: Table }): ToNKDKResult => {
  const { context, element } = params

  const result: ToNKDKResult = {
    strings: [],
    toOneLineGroup: false,
  }

  const autoCommandBar = exportAutoCommandBarToNKDK({ context, element: element.autoCommandBar })
  result.strings.push(...autoCommandBar.strings)

  const tableContent = exportTableContentToNKDK(context, element)
  result.strings.push(...tableContent.strings)

  return result
}

const exportTableContentToNKDK = (context: ConfigurationContext, element: Table): ToNKDKResult => {
  const childItems = element.childItems ?? []

  const parts: string[] = []

  const columns = exportChildItemsContentToNKDK(context, childItems)
  parts.push(...columns.strings)

  const tableName = formatElementName(element)
  parts.push(tableName)

  const resultString = TableColumnSeparator + " " + parts.join(" " + TableColumnSeparator + " ")

  return {
    strings: [resultString],
    toOneLineGroup: false,
  }
}

// const formatTableColumn = (context: ConfigurationContext, column: NamedElement): string => {
//   const exportContentFunction = getElementOperationFunction("ExportToStructureContent", column.itemType)
//   if (exportContentFunction) {
//     const result = exportContentFunction(context, column) as ToNKDKResult
//     return result.strings[0] || formatElementName(column)
//   }

//   return formatElementTitleAndName(context, column)
// }
