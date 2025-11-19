import { TBaseElement } from "./types"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const formatOtherElement: FormatElementFunction = (
  element: TBaseElement,
  _configurationSettings: TConfigurationSettings
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: ["?" + element.elementType + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
