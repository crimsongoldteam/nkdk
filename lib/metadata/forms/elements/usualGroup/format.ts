import { FormatElementFunction, IFormatElementResult } from "~/lib/format/types"
import { Context } from "~/lib/metadata/context/types"
import { BaseElement } from "../baseElement/types"
import { formatHorizontalGroup } from "./format/horizontalGroupFormat"
import { formatOneLineGroup } from "./format/oneLineGroupFormat"
import { formatVerticalGroup } from "./format/verticalGroupFormat"
import { isOneLineGroup, isVerticalGroup } from "./helpers"
import { UsualGroup } from "./types"

export const formatUsualGroup: FormatElementFunction = (
  element: BaseElement,
  configurationSettings: Context
): IFormatElementResult => {
  const usualGroup = element as UsualGroup
  if (isVerticalGroup(usualGroup)) return formatVerticalGroup(usualGroup, configurationSettings)
  if (isOneLineGroup(usualGroup)) return formatOneLineGroup(usualGroup, configurationSettings)

  return formatHorizontalGroup(usualGroup, configurationSettings)
}
