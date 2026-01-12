import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { ExtendedTooltip, ExtendedTooltipPropsEnterprise } from "~/metadata/forms/elements/extendedTooltip/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  fullFormDecoration,
  fullFormDecorationEnterprise,
  minimalFormDecoration,
  minimalFormDecorationEnterprise,
} from "../formDecoration/data"

export const withContentExtendedTooltip: ExtendedTooltip = {
  title: {
    items: { ru: "С заголовком" },
  },
}

export const defaultExtendedTooltip: ExtendedTooltip = {}

export const parentElement: BaseElement = {
  elementType: FormElementType.InputField,
  name: "КакойТоЭлемент",
}

export const otherParentElement: BaseElement = {
  elementType: FormElementType.InputField,
  name: "ДругойЭлемент",
}

export const fullExtendedTooltip: ExtendedTooltip = { ...fullFormDecoration }

export const fullExtendedTooltipEnterprise: ExtendedTooltipPropsEnterprise = { ...fullFormDecorationEnterprise }

export const minimalExtendedTooltip: ExtendedTooltip = {
  ...minimalFormDecoration,
}

export const minimalExtendedTooltipEnterprise: ExtendedTooltipPropsEnterprise = { ...minimalFormDecorationEnterprise }
