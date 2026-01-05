import { formatElementName } from "~/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PictureDecoration } from "./types"

export const formatPictureDecoration: FormatElementFunction = (
  element: PictureDecoration,
  _context: ConfigurationContext
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: ["@" + element.picture?.ref + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
