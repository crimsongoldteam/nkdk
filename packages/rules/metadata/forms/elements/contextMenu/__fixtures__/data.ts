import { NamedElement } from "../../baseElement/types"
import { ContextMenu, ContextMenuYAML } from "../types"

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
  Элементы: {
    Кнопка: {
      Вид: "Кнопка",
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
