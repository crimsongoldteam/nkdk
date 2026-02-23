import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/commonObjects/childItems/parser/tokenizer/lexer"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { ColumnGroup } from "./types"

const HASH = t.Hash.LABEL as string

export const exportColumnGroupContentToStructure = (
  _context: ConfigurationContext,
  element: ColumnGroup
): ToNKDKResult => {
  const resultString = HASH + formatElementName(element)

  return {
    strings: [resultString],
    toOneLineGroup: false,
  }
}

export const exportColumnGroupToStructure = (_context: ConfigurationContext, element: ColumnGroup): ToNKDKResult => {
  return exportColumnGroupContentToStructure(_context, element)
}

registerElementOperation("ExportToStructureContent", "ColumnGroup", exportColumnGroupContentToStructure)
registerElementOperation("ExportToStructure", "ColumnGroup", exportColumnGroupToStructure)
registerIsOneLineElementCheck<ColumnGroup>(CollectionFormElementType.ColumnGroup, () => true)
