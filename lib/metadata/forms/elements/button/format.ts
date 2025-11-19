import { TButton } from "./types"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const formatButton: FormatElementFunction = (
  element: TButton,
  _configurationSettings: TConfigurationSettings
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
