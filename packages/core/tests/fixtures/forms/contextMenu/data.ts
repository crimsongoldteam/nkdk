import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import { FormElementType } from "~/metadata/metadataFactory/metadataType/types"

export const parentElement: NamedElement = {
  itemType: FormElementType.InputField,
  name: "КакойТоЭлемент",
}

export const fullContextMenu: ContextMenu = {
  itemType: "ContextMenu",
  displayImportance: "High",
  autofill: true,
  childItems: [
    {
      itemType: FormElementType.Button,
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
  itemType: "ContextMenu",
  childItems: [],
}

export const minimalContextMenuEnterprise: ContextMenuEnterprise = {}
