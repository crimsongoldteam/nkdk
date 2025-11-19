import { TPictureDecoration } from "./types"
import {
  IFormatterParams,
  FormatElementFunction,
  IFormatElementResult,
} from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"

export const formatPictureDecoration: FormatElementFunction<
  TPictureDecoration
> = (
  element: TPictureDecoration,
  _params: IFormatterParams
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: ["@" + element.picture?.ref + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
