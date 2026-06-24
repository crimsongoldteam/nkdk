import type { Table, TablePartialYAML } from "../types"

export const nonCanonicalSingletonNames = {
  itemType: "Table",
  name: "Подписи",
  childItems: [],
  dataPath: "Подписи",
  viewStatusRepresentation: {
    itemType: "SingleViewStatusAddition",
    horizontalAlign: "Left",
  },
} satisfies Table

export const nonCanonicalSingletonNamesYAML = {
  ПутьКДанным: "Подписи",
  ОтображениеСостоянияПросмотра: {
    ГоризонтальноеПоложение: "Лево",
  },
} satisfies TablePartialYAML
