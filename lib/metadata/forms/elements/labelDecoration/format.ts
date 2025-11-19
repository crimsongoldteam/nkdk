import { TLabelDecoration } from "./types"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const formatLabelDecoration: FormatElementFunction = (
  element: TLabelDecoration,
  _configurationSettings: TConfigurationSettings
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: [element.title?.items.ru + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
