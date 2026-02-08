import { ConfigurationContext } from "~/metadata/context/types"
import { getElementId } from "~/metadata/helpers/getElementId"
import { ElementXML, exportSingleElementToXML, PropertyRule, registerTypeRule } from "~/metadata/metadataFactory"
import { getExtendedTooltipName } from "./helper"
import { ExtendedTooltipRules } from "./rules"
import { ExtendedTooltip } from "./types"

export const exportExtendedTooltipToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  element: ExtendedTooltip | undefined
): ElementXML => {
  if (!context.elementContext) throw new Error("elementContext is not defined")
  const parent = context.elementContext
  const id = getElementId(context)
  const name = getExtendedTooltipName(parent)
  return exportSingleElementToXML({
    context,
    element: element,
    rule: ExtendedTooltipRules,
    id,
    name,
  })!
}

registerTypeRule("ExtendedTooltip", "exportToXML", exportExtendedTooltipToXML)
