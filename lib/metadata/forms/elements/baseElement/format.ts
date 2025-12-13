import { formatElementName } from "~/lib/format/helpers"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { BaseElement } from "./types"

export const formatOtherElement: FormatElementFunction = (
  element: BaseElement,
  _configurationSettings: TConfigurationSettings
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: ["?" + element.elementType + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
