import { formatElementName } from "~/lib/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { Context } from "~/lib/metadata/context/types"
import { Button } from "./types"

export const formatButton: FormatElementFunction = (
  element: Button,
  _configurationSettings: Context
): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: ["<" + element.title?.items?.["ru"] + " " + formatElementName(element) + ">"],
    haveSimpleHorizontalGroup: false,
  }
  return result
}
