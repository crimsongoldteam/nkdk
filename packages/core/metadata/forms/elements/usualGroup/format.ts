import { FormatElementFunction, IFormatElementResult } from "~/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement } from "../baseElement/types"
import { formatHorizontalGroup } from "./format/horizontalGroupFormat"
import { formatOneLineGroup } from "./format/oneLineGroupFormat"
import { formatVerticalGroup } from "./format/verticalGroupFormat"
import { isOneLineGroup, isVerticalGroup } from "./helpers"
import { UsualGroup } from "./types"

export const formatUsualGroup: FormatElementFunction = (
  element: BaseElement,
  context: ConfigurationContext
): IFormatElementResult => {
  const usualGroup = element as UsualGroup
  if (isVerticalGroup(usualGroup)) return formatVerticalGroup(usualGroup, context)
  if (isOneLineGroup(usualGroup)) return formatOneLineGroup(usualGroup, context)

  return formatHorizontalGroup(usualGroup, context)
}
