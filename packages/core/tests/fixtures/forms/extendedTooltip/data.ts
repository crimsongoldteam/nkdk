import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { ExtendedTooltip } from "~/metadata/forms/elements/extendedTooltip/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

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
