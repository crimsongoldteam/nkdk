import { TButton } from "./types"
import {
  IFormatterParams,
  FormatElementFunction,
  IFormatElementResult,
} from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"

export const formatButton: FormatElementFunction<TButton> = (
  element: TButton,
  _params: IFormatterParams
): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: [
      "<" +
        element.title?.items?.["ru"] +
        " " +
        formatElementName(element) +
        ">",
    ],
    haveSimpleHorizontalGroup: false,
  }
  return result
}
