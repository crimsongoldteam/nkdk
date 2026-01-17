import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/collections/childItems/parser/tokenizer/lexer"
import { formatElementName, formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureFn, FormElementType } from "../../../metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { exportAutoCommandBarToStructure } from "../autoCommandBar/exportToStructure"
import { NamedElement } from "../baseElement/types"
import { Table } from "./types"

const V_BAR = t.VBar.LABEL as string

export const exportTableToStructure: FormatElementFunction = (
  context: ConfigurationContext,
  element: NamedElement | undefined
): IFormatElementResult => {
  const table = element as Table
  const childItems = table.childItems ?? []

  const result: IFormatElementResult = {
    strings: [],
    haveSimpleHorizontalGroup: false,
  }

  const autoCommandBar = exportAutoCommandBarToStructure(context, table.autoCommandBar)
  result.strings.push(...autoCommandBar.strings)

  const parts: string[] = []

  for (const column of childItems) {
    const columnFormatted = formatElementTitleAndName(context, column)
    parts.push(columnFormatted)
  }

  const tableName = formatElementName(table)
  parts.push(tableName)

  const resultString = V_BAR + " " + parts.join(" | ")

  result.strings.push(resultString)

  return result
}

registerIsOneLineElementCheck(FormElementType.Table, () => false)
registerMetadata("ExportToStructure", "Table", exportTableToStructure as ExportToStructureFn)
