import { formatGroupWrapping } from "~/lib/format/wrap/formatGroupWrapping"
import { TNamedElement } from "./types"
import { IFormatterParams, FormatFunction, IFormatElementResult } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"

export const formatOtherElement: FormatFunction<TNamedElement> = (
  element: TNamedElement,
  params: IFormatterParams
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: ["?" + element.type + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
