import { TLabelDecoration } from "./types"
import { IFormatterParams, FormatFunction, IFormatElementResult } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"

export const formatLabelDecoration: FormatFunction<TLabelDecoration> = (
  element: TLabelDecoration,
  _params: IFormatterParams
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: [element.title?.items.ru + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
