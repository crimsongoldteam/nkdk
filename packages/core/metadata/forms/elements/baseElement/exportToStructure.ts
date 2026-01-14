import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { FormElementTypeToEnterprise } from "../../../metadataFactory/types"
import { NamedElement } from "./types"

export const exportOtherElementToStructure = (
  _context: ConfigurationContext,
  element: NamedElement
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: ["?" + FormElementTypeToEnterprise[element.elementType] + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
