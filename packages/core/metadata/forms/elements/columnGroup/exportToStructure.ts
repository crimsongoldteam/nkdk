import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/commonObjects/childItems/parser/tokenizer/lexer"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { ColumnGroup } from "./types"

const HASH = t.Hash.LABEL as string

export const exportColumnGroupContentToStructure = (
  _context: ConfigurationContext,
  element: ColumnGroup
): IFormatElementResult => {
  const resultString = HASH + formatElementName(element)

  return resultString
}

export const exportColumnGroupToStructure = (
  _context: ConfigurationContext,
  element: ColumnGroup
): IFormatElementResult => {
  return exportColumnGroupContentToStructure(_context, element)
}

// registerElementOperation("ExportToStructureContent", "ColumnGroup", exportColumnGroupContentToStructure)
// registerElementOperation("ExportToStructure", "ColumnGroup", exportColumnGroupToStructure)
