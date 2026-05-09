import type { CalculatedField, CalculatedFieldYAML } from "../types"

export const fullCalculatedField = {
  itemType: "CalculatedField",
  dataPath: "Поле1",
  expression: "Истина",
  title: { items: { ru: "Поле1" } },
  useRestriction: {
    itemType: "CalculatedFieldUseRestriction",
    field: true,
    group: true,
  },
  presentationExpression: "Наименование",
  orderExpressions: [
    {
      itemType: "CalculatedFieldOrderExpression",
      expression: "Наименование",
      orderType: "Asc",
      autoOrder: true,
    },
  ],
  valueType: { type: ["string"] },
} as const satisfies CalculatedField

export const fullCalculatedFieldYAML = {
  ПутьКДанным: "Поле1",
  Выражение: "Истина",
  Заголовок: "Поле1",
  ОграничениеИспользования: {
    Поле: "Истина",
    Группировка: "Истина",
  },
  ВыражениеПредставления: "Наименование",
  ВыраженияУпорядочивания: [
    {
      Выражение: "Наименование",
      ТипУпорядочивания: "Возр",
      Автоупорядочивание: "Истина",
    },
  ],
  ТипЗначения: "Строка",
} as const satisfies CalculatedFieldYAML

export const appearanceCalculatedField = {
  itemType: "CalculatedField",
  dataPath: "ОбщееСостояниеПодключения",
  expression: "",
  title: { items: { ru: "Настройки" } },
  appearance: {
    itemType: "AppearanceFields",
    ЦветТекста: {
      parameter: "ЦветТекста",
      value: { type: "Absolute", value: "#1C55AE" },
    },
  },
} as const satisfies CalculatedField

export const appearanceCalculatedFieldYAML = {
  ПутьКДанным: "ОбщееСостояниеПодключения",
  Выражение: "",
  Заголовок: "Настройки",
  Оформление: {
    ЦветТекста: "#1C55AE",
  },
} as const satisfies CalculatedFieldYAML
