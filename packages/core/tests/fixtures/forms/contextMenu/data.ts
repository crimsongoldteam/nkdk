import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ContextMenu, ContextMenuYAML } from "~/metadata/forms/elements/contextMenu/types"

export const parentElement: NamedElement = {
  itemType: "InputField",
  name: "КакойТоЭлемент",
}

export const fullContextMenu: ContextMenu = {
  itemType: "ContextMenu",
  displayImportance: "High",
  autofill: true,
  childItems: [
    {
      itemType: "Button",
      name: "Кнопка",
    },
  ],
}

export const fullContextMenuYAML: ContextMenuYAML = {
  ВажностьПриОтображении: "Высокая",
  Автозаполнение: "Истина",
  ПодчиненныеЭлементы: {
    Кнопка: {
      Тип: "Кнопка",
    },
  },
}

export const fullContextMenuSource: ContextMenu = {
  itemType: "ContextMenu",
  displayImportance: "High",
  autofill: true,
  childItems: [],
}

export const minimalContextMenu: ContextMenu = {
  itemType: "ContextMenu",
  childItems: [],
}

export const minimalContextMenuYAML: ContextMenuYAML = {}
