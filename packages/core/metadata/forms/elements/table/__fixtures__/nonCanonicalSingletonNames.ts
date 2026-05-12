import type { Table, TablePartialYAML } from "../types"

export const nonCanonicalSingletonNames = {
  itemType: "Table",
  name: "Подписи",
  childItems: [],
  dataPath: "Подписи",
  viewStatusRepresentation: {
    itemType: "ViewStatusAddition",
    horizontalAlign: "Left",
  },
} satisfies Table

export const nonCanonicalSingletonNamesYAML = {
  ОтображениеСостоянияПросмотра: {
    ГоризонтальноеПоложение: "Лево",
  },
} satisfies TablePartialYAML
