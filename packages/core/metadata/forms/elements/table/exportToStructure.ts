import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/commonObjects/childItems/parser/tokenizer/lexer"
import { formatElementName, formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/metadata/forms/format/types"
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
    const result = exportContentFunction(context, column) as IFormatElementResult
    return result.strings[0] || formatElementName(column)
  }

  return formatElementTitleAndName(context, column)
}

export const exportTableContentToStructure = (context: ConfigurationContext, element: Table): IFormatElementResult => {
  const childItems = element.childItems ?? []

  const parts: string[] = []

  for (const column of childItems) {
    const columnFormatted = formatTableColumn(context, column)
    parts.push(columnFormatted)
  }

  const tableName = formatElementName(element)
  parts.push(tableName)

  const resultString = V_BAR + " " + parts.join(" | ")

  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

export const exportTableToStructure: FormatElementFunction = (
  context: ConfigurationContext,
  element: NamedElement | undefined
): IFormatElementResult => {
  const table = element as Table

  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const autoCommandBar = exportAutoCommandBarToStructure(context, table.autoCommandBar)
  result.strings.push(...autoCommandBar.strings)

  const tableContent = exportTableContentToStructure(context, table)
  result.strings.push(...tableContent.strings)

  return result
}

registerIsOneLineElementCheck(CollectionFormElementType.Table, () => false)
registerElementOperation(
  "ExportToStructureContent",
  "Table",
  exportTableContentToStructure as ExportToStructureContentFn
)
registerElementOperation("ExportToStructure", "Table", exportTableToStructure as ExportToStructureFn)
