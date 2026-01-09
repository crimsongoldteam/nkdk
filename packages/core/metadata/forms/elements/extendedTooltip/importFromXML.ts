import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipXML } from "~/metadata/forms/elements/extendedTooltip/types"
import { importFormDecorationFromXML } from "~/metadata/forms/elements/formDecoration/importFromXML"
import { BaseElement } from "../baseElement/types"
import { isDefaultExtendedTooltipName } from "./helper"

export const importExtendedTooltipFromXML = (
  context: ConfigurationContext,
  xml: ExtendedTooltipXML | undefined,
  parentElement: BaseElement
): ExtendedTooltip | undefined => {
  const result = importFormDecorationFromXML(context, xml)

  if (isHasContent(parentElement, result)) return result

  return undefined
}

const isHasContent = (parentElement: BaseElement, data: ExtendedTooltip | undefined): boolean => {
  if (!data) return false

  if (!isDefaultExtendedTooltipName(parentElement, data)) return true

  const keys = Object.keys(data)
  const hasOtherFields = keys.some((key) => key !== "name" && key !== "id" && key !== "elementType")

  return hasOtherFields
}
