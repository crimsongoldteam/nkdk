import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/forms/format/types"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ExportToStructureContentFn } from "~/metadata/metadataFactory/elements/types"
import { formatElementName } from "../../format/helpers"
import { SearchControlAddition } from "./types"

export function exportSearchControlAdditionContentToStructure(
  _context: ConfigurationContext,
  element: SearchControlAddition
): ToNKDKResult {
  const resultString = "?УправлениеПоиском " + formatElementName(element)
  return {
    strings: [resultString],
    toOneLineGroup: false,
  }
}

registerElementOperation(
  "ExportToStructureContent",
  "SearchControlAddition",
  exportSearchControlAdditionContentToStructure as ExportToStructureContentFn
)
