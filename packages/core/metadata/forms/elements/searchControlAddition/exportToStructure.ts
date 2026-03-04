import { ConfigurationContext } from "~/metadata/context/types"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { ExportToStructureContentFn } from "~/metadata/orchestration/formElement/types"
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
