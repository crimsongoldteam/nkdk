import { ConfigurationContext } from "~/metadata/context/types"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { ExportToStructureContentFn } from "~/metadata/metadataFactory/elements/types"
import { formatElementName } from "../../format/helpers"
import { SearchStringAddition } from "./types"

export function exportSearchStringAdditionContentToStructure(
  _context: ConfigurationContext,
  element: SearchStringAddition
): ToNKDKResult {
  const resultString = "?ОтображениеСтрокиПоиска " + formatElementName(element)
  return {
    strings: [resultString],
    toOneLineGroup: false,
  }
}

registerElementOperation(
  "ExportToStructureContent",
  "SearchStringAddition",
  exportSearchStringAdditionContentToStructure as ExportToStructureContentFn
)
