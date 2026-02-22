import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/commonObjects/childItems/parser/tokenizer/lexer"
import { formatElementName, formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { FormatElementFunction, ToNKDKResult } from "~/metadata/forms/format/types"
import { CollectionFormElementType, ExportToStructureContentFn, ExportToStructureFn } from "~/metadata/metadataFactory"
import {
  getElementOperationFunction,
  registerElementOperation,
} from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { exportAutoCommandBarToStructure } from "../autoCommandBar/exportToStructure"
import { NamedElement } from "../baseElement/types"
import { Table } from "./types"

const V_BAR = t.VBar.LABEL as string

const formatTableColumn = (context: ConfigurationContext, column: NamedElement): string => {
  const exportContentFunction = getElementOperationFunction("ExportToStructureContent", column.itemType)
  if (exportContentFunction) {
    const result = exportContentFunction(context, column) as ToNKDKResult
    return result[0] || formatElementName(column)
  }

  return formatElementTitleAndName(context, column)
}

export const exportTableContentToStructure = (context: ConfigurationContext, element: Table): ToNKDKResult => {
  const childItems = element.childItems ?? []

  const parts: string[] = []

  for (const column of childItems) {
    const columnFormatted = formatTableColumn(context, column)
    parts.push(columnFormatted)
  }

  const tableName = formatElementName(element)
  parts.push(tableName)

  const resultString = V_BAR + " " + parts.join(" | ")

  return resultString
}

export const exportTableToStructure: FormatElementFunction = (
  context: ConfigurationContext,
  element: NamedElement | undefined
): ToNKDKResult => {
  const table = element as Table

  const result: ToNKDKResult = []

  const autoCommandBar = exportAutoCommandBarToStructure(context, table.autoCommandBar)
  result.push(...autoCommandBar)

  const tableContent = exportTableContentToStructure(context, table)
  result.push(...tableContent)

  return result
}

registerIsOneLineElementCheck(CollectionFormElementType.Table, () => false)
registerElementOperation(
  "ExportToStructureContent",
  "Table",
  exportTableContentToStructure as ExportToStructureContentFn
)
registerElementOperation("ExportToStructure", "Table", exportTableToStructure as ExportToStructureFn)
