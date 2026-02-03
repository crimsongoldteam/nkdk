import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn } from "~/metadata/metadataFactory/types"
import { formatElementName } from "../../format/helpers"
import { SearchStringAddition } from "./types"
import { PropertyRule } from "../calendarField/rules"

export function exportSearchStringAdditionContentToStructure(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  element: SearchStringAddition
): IFormatElementResult {
  const resultString = "?ОтображениеСтрокиПоиска " + formatElementName(element)
  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

registerMetadata(
  "ExportToStructureContent",
  "SearchStringAddition",
  exportSearchStringAdditionContentToStructure as ExportToStructureContentFn
)
