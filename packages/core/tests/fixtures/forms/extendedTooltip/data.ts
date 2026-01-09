import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { ExtendedTooltip } from "~/metadata/forms/elements/extendedTooltip/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const withContentExtendedTooltip: ExtendedTooltip = {
  elementType: FormElementType.FormDecoration,
  name: "КакойТоЭлементРасширеннаяПодсказка",
  id: "1",
  title: {
    items: { ru: "С заголовком" },
  },
}

export const defaultExtendedTooltip: ExtendedTooltip = {
  elementType: FormElementType.FormDecoration,
  name: "КакойТоЭлементРасширеннаяПодсказка",
  id: "1",
}

export const parentElement: BaseElement = {
  elementType: FormElementType.InputField,
  name: "КакойТоЭлемент",
  id: "1",
}

export const otherParentElement: BaseElement = {
  elementType: FormElementType.InputField,
  name: "ДругойЭлемент",
  id: "1",
}
