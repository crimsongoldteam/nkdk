import { TButton } from "./types"
import { IFormatterParams, FormatFunction, IFormatElementResult } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"

export const formatButton: FormatFunction<TButton> = (
  element: TButton,
  _params: IFormatterParams
): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: ["<" + element.title?.ru + formatElementName(element) + ">"],
    haveSimpleHorizontalGroup: false,
  }
  return result
}
