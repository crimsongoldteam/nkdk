import { formatElementName } from "~/packages/core/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/packages/core/format/types"
import { Context } from "~/packages/core/metadata/context/types"
import { Button } from "./types"

export const formatButton: FormatElementFunction = (element: Button, _context: Context): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: ["<" + element.title?.items?.["ru"] + " " + formatElementName(element) + ">"],
    haveSimpleHorizontalGroup: false,
  }
  return result
}
