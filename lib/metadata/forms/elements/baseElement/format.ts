import { TBaseElement } from "./types"
import { IFormatterParams, FormatFunction, IFormatElementResult } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"

export const formatOtherElement: FormatFunction<TBaseElement> = (
  element: TBaseElement,
  _params: IFormatterParams
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: ["?" + element.elementType + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
