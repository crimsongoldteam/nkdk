import { PictureDecoration } from "./types"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const formatPictureDecoration: FormatElementFunction = (
  element: PictureDecoration,
  _configurationSettings: ConfigurationSettings
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: ["@" + element.picture?.ref + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
