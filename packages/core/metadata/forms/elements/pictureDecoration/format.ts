import { formatElementName } from "~/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/format/types"
import { Context } from "~/metadata/context/types"
import { PictureDecoration } from "./types"

export const formatPictureDecoration: FormatElementFunction = (
  element: PictureDecoration,
  _context: Context
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: ["@" + element.picture?.ref + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
