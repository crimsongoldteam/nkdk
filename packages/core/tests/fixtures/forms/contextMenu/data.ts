import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const parentElement: NamedElement = {
  elementType: FormElementType.InputField,
  name: "КакойТоЭлемент",
}

export const fullContextMenu: ContextMenu = {
  elementType: "ContextMenu",
  displayImportance: "High",
  autofill: true,
  childItems: [
    {
      elementType: FormElementType.Button,
      name: "Кнопка",
    },
  ],
}

export const fullContextMenuEnterprise: ContextMenuEnterprise = {
  ВажностьПриОтображении: "Высокая",
  Автозаполнение: "Истина",
  ПодчиненныеЭлементы: {
    Кнопка: {
      Тип: "Кнопка",
    },
  },
}

export const minimalContextMenu: ContextMenu = {
  elementType: "ContextMenu",
  childItems: [],
}

export const minimalContextMenuEnterprise: ContextMenuEnterprise = {}
