import { ConfigurationContext } from "~/metadata/context/types"
import { FormatElementFunction, IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureFn, FormElementType } from "../../../metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { NamedElement } from "../baseElement/types"
import { PropertyRule } from "../calendarField/rules"
import { formatHorizontalGroup } from "./format/horizontalGroupFormat"
import { formatOneLineGroup } from "./format/oneLineGroupFormat"
import { formatVerticalGroup } from "./format/verticalGroupFormat"
import { isOneLineGroup, isVerticalGroup } from "./helpers"
import { UsualGroup } from "./types"

export const exportUsualGroupToStructure: FormatElementFunction = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  element: NamedElement
): IFormatElementResult => {
  const usualGroup = element as UsualGroup
  if (isVerticalGroup(usualGroup)) return formatVerticalGroup(context, usualGroup)
  if (isOneLineGroup(context, usualGroup)) return formatOneLineGroup(context, usualGroup)

  return formatHorizontalGroup(context, usualGroup)
}

registerIsOneLineElementCheck(FormElementType.UsualGroup, () => false)
registerMetadata("ExportToStructure", "UsualGroup", exportUsualGroupToStructure as ExportToStructureFn)
