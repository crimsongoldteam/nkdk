import { formatElementName } from "~/lib/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { Context } from "~/lib/metadata/context/types"
import { FormElementTypeToEnterprise } from "../../../metadataFactory/types"
import { BaseElement } from "./types"

export const formatOtherElement: FormatElementFunction = (
  element: BaseElement,
  _configurationSettings: Context
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: ["?" + FormElementTypeToEnterprise[element.elementType] + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
