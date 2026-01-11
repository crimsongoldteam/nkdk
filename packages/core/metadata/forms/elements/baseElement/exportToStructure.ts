import { formatElementName } from "~/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementTypeToEnterprise } from "../../../metadataFactory/types"
import { BaseElement } from "./types"

export const exportOtherElementToStructure = (
  _context: ConfigurationContext,
  element: BaseElement
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: ["?" + FormElementTypeToEnterprise[element.elementType] + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
