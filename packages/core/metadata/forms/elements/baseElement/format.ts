import { formatElementName } from "~/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/format/types"
import { Context } from "~/metadata/context/types"
import { FormElementTypeToEnterprise } from "../../../metadataFactory/types"
import { BaseElement } from "./types"

export const formatOtherElement: FormatElementFunction = (
  element: BaseElement,
  _context: Context
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: ["?" + FormElementTypeToEnterprise[element.elementType] + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
