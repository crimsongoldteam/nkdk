import { formatElementName } from "~/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/format/types"
import { Context } from "~/metadata/context/types"
import { LabelDecoration } from "./types"

export const formatLabelDecoration: FormatElementFunction = (
  element: LabelDecoration,
  _context: Context
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: [element.title?.items.ru + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
