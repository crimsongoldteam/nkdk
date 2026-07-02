import type { TypeDescription } from "../../../typeDescription/types"
import { explicitYAMLString } from "../../../../../yaml/explicitString"
import type { DCSParameters, DCSParametersYAML } from "../types"

const compositeValueType = {
  type: ["boolean", "string", "dateTime", "decimal"],
  dateQualifiers: { dateFractions: "DateTime" },
} as const satisfies TypeDescription

const stringValueType = {
  type: ["string"],
} as const satisfies TypeDescription

export const fullDCSParameters = [
  {
    itemType: "DCSParameter" as const,
    name: "ВходящиеПараметры",
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
  },
  {
    itemType: "DCSParameter" as const,
    name: "СоставнойДоступенСписок",
    title: { items: { ru: "Составной доступен список" } },
    valueType: compositeValueType,
    valueListAllowed: true,
  },
  {
    itemType: "DCSParameter" as const,
    name: "Составной",
    title: { items: { ru: "Составной" } },
    valueType: compositeValueType,
  },
  {
    itemType: "DCSParameter" as const,
    name: "БезТипаДоступенСписок",
    title: { items: { ru: "Без типа доступен список" } },
    valueListAllowed: true,
  },
  {
    itemType: "DCSParameter" as const,
    name: "БезТипа",
    title: { items: { ru: "Без типа" } },
  },
  {
    itemType: "DCSParameter" as const,
    name: "СТипомДоступенСписок",
    title: { items: { ru: "С типом доступен список" } },
    valueType: stringValueType,
    valueListAllowed: true,
  },
  {
    itemType: "DCSParameter" as const,
    name: "СТипом",
    title: { items: { ru: "С типом" } },
  },
] as const satisfies DCSParameters

export const explicitNullValueDCSParameters = [
  {
    itemType: "DCSParameter" as const,
    name: "ПустоеЗначение",
    title: { items: { ru: "Пустое значение" } },
    value: null,
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
  ВходящиеПараметры: {
    Заголовок: "Параметр1",
    ОграничениеИспользования: "Истина",
    ПараметрыРедактирования: {
      БыстрыйВыбор: {
        Значение: "Истина",
      },
      ВыборГруппИЭлементов: {
        Значение: "Элементы",
      },
      Маска: {
        Значение: explicitYAMLString("123"),
      },
      ПараметрыВыбора: {
        Значение: {
          Параметр: 123,
        },
      },
      СвязиПараметровВыбора: {
        Значение: [
          {
            Имя: "ПараметрВыбора",
            ПутьКДанным: "Поле1",
            РежимИзменения: "НеИзменять",
          },
        ],
      },
      СвязьПоТипу: {
        Значение: "Поле1(2)",
      },
      ФормаВыбора: {
        Значение: explicitYAMLString("ФормаВыбора"),
      },
      ФорматРедактирования: {
        Значение: explicitYAMLString("ЧЦ=15; ЧДЦ=2"),
      },
    },
  },
  СоставнойДоступенСписок: {
    Заголовок: "Составной доступен список",
    ТипЗначения: ["Булево", "Строка", "ДатаВремя", "Число"],
    ДоступенСписокЗначений: "Истина",
  },
  Составной: {
    Заголовок: "Составной",
    ТипЗначения: ["Булево", "Строка", "ДатаВремя", "Число"],
  },
  БезТипаДоступенСписок: {
    Заголовок: "Без типа доступен список",
    ДоступенСписокЗначений: "Истина",
  },
  БезТипа: {
    Заголовок: "Без типа",
  },
  СТипомДоступенСписок: {
    Заголовок: "С типом доступен список",
    ТипЗначения: "Строка",
    ДоступенСписокЗначений: "Истина",
  },
  СТипом: {
    Заголовок: "С типом",
  },
} as const satisfies DCSParametersYAML

export const explicitNullValueDCSParametersYAML = {
  ПустоеЗначение: {
    Заголовок: "Пустое значение",
    Значение: null,
  },
} as const satisfies DCSParametersYAML

export const minimalDCSParametersYAML = {
  Параметр4: {
    Заголовок: "Параметр4",
  },
} as const satisfies DCSParametersYAML
