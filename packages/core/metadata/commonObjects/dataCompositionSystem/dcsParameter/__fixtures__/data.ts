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
    use: "Always" as const,
  },
  {
    itemType: "DCSParameter" as const,
    name: "Параметр2",
    title: { items: { ru: "Параметр2" } },
    valueType: param2ValueType,
    useRestriction: false,
    valueListAllowed: true,
  },
  {
    itemType: "DCSParameter" as const,
    name: "Параметр3",
    title: { items: { ru: "Параметр3" } },
    useRestriction: false,
    valueListAllowed: true,
  },
] as const satisfies DCSParameters

export const minimalDCSParameters = [
  {
    itemType: "DCSParameter" as const,
    name: "Параметр4",
    title: { items: { ru: "Параметр4" } },
    useRestriction: false,
  },
] as const satisfies DCSParameters

export const fullDCSParametersYAML = {
  Параметр1: {
    Заголовок: "Параметр1",
    ОграничениеИспользования: "Истина",
    Использование: "Всегда",
  },
  Параметр2: {
    Заголовок: "Параметр2",
    ТипЗначения: ["Булево", "Строка", "ДатаВремя", "Число"],
    ОграничениеИспользования: "Ложь",
    ДоступенСписокЗначений: "Истина",
  },
  Параметр3: {
    Заголовок: "Параметр3",
    ОграничениеИспользования: "Ложь",
    ДоступенСписокЗначений: "Истина",
  },
} as const satisfies DCSParametersYAML

export const minimalDCSParametersYAML = {
  Параметр4: {
    Заголовок: "Параметр4",
    ОграничениеИспользования: "Ложь",
  },
} as const satisfies DCSParametersYAML
