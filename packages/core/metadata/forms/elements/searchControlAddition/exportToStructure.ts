import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn } from "~/metadata/metadataFactory/types"
import { formatElementName } from "../../format/helpers"
import { PropertyRule } from "../calendarField/rules"
import { SearchControlAddition } from "./types"

export function exportSearchControlAdditionContentToStructure(
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  element: SearchControlAddition
): IFormatElementResult {
  const resultString = "?УправлениеПоиском " + formatElementName(element)
  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

registerMetadata(
  "ExportToStructureContent",
  "SearchControlAddition",
  exportSearchControlAdditionContentToStructure as ExportToStructureContentFn
)
