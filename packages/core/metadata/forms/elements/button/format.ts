import { formatElementName } from "~/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { Button } from "./types"

export const formatButton: FormatElementFunction = (
  element: Button,
  _context: ConfigurationContext
): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: ["<" + element.title?.items?.["ru"] + " " + formatElementName(element) + ">"],
    haveSimpleHorizontalGroup: false,
  }
  return result
}
