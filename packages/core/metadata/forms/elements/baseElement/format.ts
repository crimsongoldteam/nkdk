import { formatElementName } from "~/packages/core/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/packages/core/format/types"
import { Context } from "~/packages/core/metadata/context/types"
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
