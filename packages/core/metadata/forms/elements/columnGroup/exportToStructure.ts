import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/commonObjects/childItems/parser/tokenizer/lexer"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { ColumnGroup } from "./types"

const HASH = t.Hash.LABEL as string

export const exportColumnGroupContentToStructure = (
  _context: ConfigurationContext,
  element: ColumnGroup
): IFormatElementResult => {
  const resultString = HASH + formatElementName(element)

  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

export const exportColumnGroupToStructure = (
  _context: ConfigurationContext,
  element: ColumnGroup
): IFormatElementResult => {
  return exportColumnGroupContentToStructure(_context, element)
}

registerMetadata("ExportToStructureContent", "ColumnGroup", exportColumnGroupContentToStructure)
registerMetadata("ExportToStructure", "ColumnGroup", exportColumnGroupToStructure)
registerIsOneLineElementCheck<ColumnGroup>(CollectionFormElementType.ColumnGroup, () => true)
