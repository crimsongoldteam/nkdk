import { LabelDecoration } from "./types"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const formatLabelDecoration: FormatElementFunction = (
  element: LabelDecoration,
  _configurationSettings: ConfigurationSettings
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: [element.title?.items.ru + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
