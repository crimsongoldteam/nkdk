import type { Table, TablePartialYAML } from "../types"

export const nonCanonicalSingletonNames = {
  itemType: "Table",
  name: "Подписи",
  childItems: [],
  dataPath: "Подписи",
  searchStringRepresentation: {
    itemType: "SingleSearchStringAddition",
    contextMenu: {
      itemType: "ContextMenu",
      childItems: [],
    },
    extendedTooltip: {
      itemType: "ExtendedTooltip",
    },
  },
  viewStatusRepresentation: {
    itemType: "ViewStatusAddition",
    horizontalAlign: "Left",
    contextMenu: {
      itemType: "ContextMenu",
      childItems: [],
    },
    extendedTooltip: {
      itemType: "ExtendedTooltip",
    },
  },
  searchControl: {
    itemType: "SingleSearchControlAddition",
    childItems: [],
    contextMenu: {
      itemType: "ContextMenu",
      childItems: [],
    },
    extendedTooltip: {
      itemType: "ExtendedTooltip",
    },
  },
} satisfies Table

export const nonCanonicalSingletonNamesYAML = {
  ОтображениеСтрокиПоиска: {
    КонтекстноеМеню: {},
    РасширеннаяПодсказка: {},
  },
  ОтображениеСостоянияПросмотра: {
    ГоризонтальноеПоложение: "Лево",
    КонтекстноеМеню: {},
    РасширеннаяПодсказка: {},
  },
  УправлениеПоиском: {
    КонтекстноеМеню: {},
    РасширеннаяПодсказка: {},
  },
} satisfies TablePartialYAML
