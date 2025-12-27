import { formatElementName } from "~/packages/core/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/packages/core/format/types"
import { Context } from "~/packages/core/metadata/context/types"
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
