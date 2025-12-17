import { formatElementName } from "~/lib/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { Button } from "./types"

export const formatButton: FormatElementFunction = (
  element: Button,
  _configurationSettings: ConfigurationSettings
): IFormatElementResult => {
  let result: IFormatElementResult = {
    strings: ["<" + element.title?.items?.["ru"] + " " + formatElementName(element) + ">"],
    haveSimpleHorizontalGroup: false,
  }
  return result
}
