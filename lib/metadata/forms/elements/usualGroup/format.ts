import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { TBaseElement } from "../baseElement/types"
import { formatHorizontalGroup } from "./format/horizontalGroupFormat"
import { formatOneLineGroup } from "./format/oneLineGroupFormat"
import { formatVerticalGroup } from "./format/verticalGroupFormat"
import { isOneLineGroup, isVerticalGroup } from "./helpers"
import { TUsualGroup } from "./types"

export const formatUsualGroup: FormatElementFunction = (
  element: TBaseElement,
  configurationSettings: TConfigurationSettings
): IFormatElementResult => {
  const usualGroup = element as TUsualGroup
  if (isVerticalGroup(usualGroup))
    return formatVerticalGroup(usualGroup, configurationSettings)
  if (isOneLineGroup(usualGroup))
    return formatOneLineGroup(usualGroup, configurationSettings)

  return formatHorizontalGroup(usualGroup, configurationSettings)
}
