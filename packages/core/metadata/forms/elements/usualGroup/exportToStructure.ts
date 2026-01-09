import { FormatElementFunction, IFormatElementResult } from "~/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement } from "../baseElement/types"
import { formatHorizontalGroup } from "./format/horizontalGroupFormat"
import { formatOneLineGroup } from "./format/oneLineGroupFormat"
import { formatVerticalGroup } from "./format/verticalGroupFormat"
import { isOneLineGroup, isVerticalGroup } from "./helpers"
import { UsualGroup } from "./types"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportUsualGroupToStructure: FormatElementFunction = (
  context: ConfigurationContext,
  element: BaseElement
): IFormatElementResult => {
  const usualGroup = element as UsualGroup
  if (isVerticalGroup(usualGroup)) return formatVerticalGroup(context, usualGroup)
  if (isOneLineGroup(usualGroup)) return formatOneLineGroup(context, usualGroup)

  return formatHorizontalGroup(context, usualGroup)
}

registerIsOneLineElementCheck(FormElementType.UsualGroup, () => false)
registerMetadata("ExportToStructure", "UsualGroup", exportUsualGroupToStructure)
