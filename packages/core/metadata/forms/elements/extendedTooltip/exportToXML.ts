import { ConfigurationContext } from "~/metadata/context/types"
import { ExtendedTooltip, ExtendedTooltipXML } from "~/metadata/forms/elements/extendedTooltip/types"
import { exportFormDecorationToXML } from "~/metadata/forms/elements/formDecoration/exportToXML"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { BaseElement } from "../baseElement/types"
import { getExtendedTooltipName } from "./helper"

export const exportExtendedTooltipToXML = (
  context: ConfigurationContext,
  data: ExtendedTooltip | undefined,
  parentElement: BaseElement
): ExtendedTooltipXML => {
  const extendedTooltip = data ?? getDefaultExtendedTooltip(parentElement)
  return exportFormDecorationToXML(context, extendedTooltip)!
}

const getDefaultExtendedTooltip = (parentElement: BaseElement): ExtendedTooltip => {
  return { name: getExtendedTooltipName(parentElement), elementType: FormElementType.FormDecoration }
}
