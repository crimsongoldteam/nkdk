import { formatElementName } from "~/lib/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { Context } from "~/lib/metadata/context/types"
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
