import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/collections/childItems/parser/tokenizer/lexer"
import { formatElementName, formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/metadata/forms/format/types"
import { getOperationFunction, registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn, ExportToStructureFn } from "../../../metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { exportAutoCommandBarToStructure } from "../autoCommandBar/exportToStructure"
import { NamedElement } from "../baseElement/types"
import { Table } from "./types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

const V_BAR = t.VBar.LABEL as string

const formatTableColumn = (context: ConfigurationContext, column: NamedElement): string => {
  // Пробуем использовать ExportToStructureContent для всех элементов
  const exportContentFunction = getOperationFunction("ExportToStructureContent", column.itemType)
  if (exportContentFunction) {
    const result = exportContentFunction(context, column) as IFormatElementResult
    return result.strings[0] || formatElementName(column)
  }

  // Для остальных элементов (включая InputField) используем formatElementTitleAndName
  // Это дает формат "title {name}" без двоеточия, что нужно для колонок таблицы
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
registerMetadata("ExportToStructureContent", "Table", exportTableContentToStructure as ExportToStructureContentFn)
registerMetadata("ExportToStructure", "Table", exportTableToStructure as ExportToStructureFn)
