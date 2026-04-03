import type { TypeDescription } from "~/metadata/commonObjects/typeDescription/types"
import type { DCSParameters, DCSParametersYAML } from "../types"

const param2ValueType = {
  type: ["boolean", "string", "dateTime", "decimal"],
  dateQualifiers: { dateFractions: "DateTime" },
} as const satisfies TypeDescription

export const fullDCSParameters = [
  {
    itemType: "DCSParameter" as const,
    name: "Параметр1",
    title: { items: { ru: "Параметр1" } },
    useRestriction: true,
    editParameters: {
      itemType: "SettingsParameterValueCollection" as const,
      parameters: {
        Маска: {
          parameter: "Маска",
          value: { type: "string", value: "123" },
        },
        СвязиПараметровВыбора: {
          parameter: "СвязиПараметровВыбора",
          value: [
            {
              dataPath: "Поле1",
              name: "ПараметрВыбора",
              valueChange: "DontChange",
            },
          ],
        },
        ПараметрыВыбора: {
          parameter: "ПараметрыВыбора",
          value: {
            name: "Параметр",
            value: { type: "decimal", value: 123 },
          },
        },
        СвязьПоТипу: {
          parameter: "СвязьПоТипу",
          value: { dataPath: "Поле1", linkItem: 2 },
        },
        ФормаВыбора: {
          parameter: "ФормаВыбора",
          value: { type: "string", value: "ФормаВыбора" },
        },
        ФорматРедактирования: {
          parameter: "ФорматРедактирования",
          value: { type: "string", value: "ЧЦ=15; ЧДЦ=2" },
        },
        БыстрыйВыбор: {
          parameter: "БыстрыйВыбор",
          value: { type: "boolean", value: true },
        },
        ВыборГруппИЭлементов: {
          parameter: "ВыборГруппИЭлементов",
          value: "Items",
        },
      },
    },
    use: "Always" as const,
  },
  {
    itemType: "DCSParameter" as const,
    name: "Параметр2",
    title: { items: { ru: "Параметр2" } },
    valueType: param2ValueType,
    useRestriction: true,
    valueListAllowed: true,
  },
  {
    itemType: "DCSParameter" as const,
    name: "Параметр3",
    title: { items: { ru: "Параметр3" } },
    useRestriction: true,
    valueListAllowed: true,
  },
] as const satisfies DCSParameters

export const minimalDCSParameters = [
  {
    itemType: "DCSParameter" as const,
    name: "Параметр4",
    title: { items: { ru: "Параметр4" } },
  },
] as const satisfies DCSParameters

export const fullDCSParametersYAML = {
  Параметр1: {
    Заголовок: "Параметр1",
    ОграничениеИспользования: "Истина",
    Использование: "Всегда",
    ПараметрыРедактирования: {
      БыстрыйВыбор: { Значение: "Истина" },
      ВыборГруппИЭлементов: { Значение: "Элементы" },
      Маска: { Значение: '"123"', Параметр: "Маска" },
      ПараметрыВыбора: { Значение: { Параметр: 123 } },
      СвязиПараметровВыбора: {
        Значение: "ПараметрВыбора(Поле1, НеИзменять)",
      },
      СвязьПоТипу: { Значение: "Поле1(2)" },
      ФормаВыбора: { Значение: '"ФормаВыбора"' },
      ФорматРедактирования: { Значение: '"ЧЦ=15; ЧДЦ=2"' },
    },
  },
  Параметр2: {
    Заголовок: "Параметр2",
    ТипЗначения: ["Булево", "Строка", "ДатаВремя", "Число"],
    ОграничениеИспользования: "Истина",
    ДоступенСписокЗначений: "Истина",
  },
  Параметр3: {
    Заголовок: "Параметр3",
    ОграничениеИспользования: "Истина",
    ДоступенСписокЗначений: "Истина",
  },
} as const satisfies DCSParametersYAML

export const minimalDCSParametersYAML = {
  Параметр4: {
    Заголовок: "Параметр4",
  },
} as const satisfies DCSParametersYAML
