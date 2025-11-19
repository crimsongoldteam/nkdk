import { TPictureDecoration } from "./types"
import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { formatElementName } from "~/lib/format/helpers"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const formatPictureDecoration: FormatElementFunction = (
  element: TPictureDecoration,
  _configurationSettings: TConfigurationSettings
): IFormatElementResult => {
  const result: IFormatElementResult = {
    strings: ["@" + element.picture?.ref + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
