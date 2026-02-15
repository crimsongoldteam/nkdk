import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ContextMenu, ContextMenuEnterprise } from "~/metadata/forms/elements/contextMenu/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

export const parentElement: NamedElement = {
  itemType: CollectionFormElementType.InputField,
  name: "КакойТоЭлемент",
}

export const fullContextMenu: ContextMenu = {
  itemType: "ContextMenu",
  displayImportance: "High",
  autofill: true,
  childItems: [
    {
      itemType: CollectionFormElementType.Button,
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
