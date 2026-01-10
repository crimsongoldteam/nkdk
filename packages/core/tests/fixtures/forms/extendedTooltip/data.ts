import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "~/metadata/forms/elements/extendedTooltip/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  fullFormDecoration,
  fullFormDecorationEnterprise,
  minimalFormDecoration,
  minimalFormDecorationEnterprise,
} from "../formDecoration/data"

export const withContentExtendedTooltip: ExtendedTooltip = {
  elementType: FormElementType.FormDecoration,
  name: "КакойТоЭлементРасширеннаяПодсказка",
  title: {
    items: { ru: "С заголовком" },
  },
}

export const defaultExtendedTooltip: ExtendedTooltip = {
  elementType: FormElementType.FormDecoration,
  name: "КакойТоЭлементРасширеннаяПодсказка",
}

export const parentElement: BaseElement = {
  elementType: FormElementType.InputField,
  name: "КакойТоЭлемент",
}

export const otherParentElement: BaseElement = {
  elementType: FormElementType.InputField,
  name: "ДругойЭлемент",
}

export const fullExtendedTooltip: ExtendedTooltip = {
  ...fullFormDecoration,
  name: "КакойТоЭлементРасширеннаяПодсказка",
}

export const fullExtendedTooltipEnterprise: ExtendedTooltipEnterprise = {
  ...fullFormDecorationEnterprise,
  Имя: "КакойТоЭлементРасширеннаяПодсказка",
}

export const minimalExtendedTooltip: ExtendedTooltip = {
  ...minimalFormDecoration,
  name: "КакойТоЭлементРасширеннаяПодсказка",
}

export const minimalExtendedTooltipEnterprise: ExtendedTooltipEnterprise = {
  ...minimalFormDecorationEnterprise,
  Имя: "КакойТоЭлементРасширеннаяПодсказка",
}
