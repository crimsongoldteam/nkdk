import { ConfigurationContext } from "~/metadata/context/types"
import * as t from "~/metadata/forms/collections/childItems/parser/tokenizer/lexer"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn, ExportToStructureFn } from "~/metadata/metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { PropertyRule } from "../calendarField/rules"
import { ColumnGroup } from "./types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

const HASH = t.Hash.LABEL as string

export const exportColumnGroupContentToStructure = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
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
  rule: PropertyRule<any>,
  element: ColumnGroup
): IFormatElementResult => {
  return exportColumnGroupContentToStructure(_context, rule, element)
}

registerMetadata(
  "ExportToStructureContent",
  "ColumnGroup",
  exportColumnGroupContentToStructure as ExportToStructureContentFn
)
registerMetadata("ExportToStructure", "ColumnGroup", exportColumnGroupToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<ColumnGroup>(CollectionFormElementType.ColumnGroup, () => true)
