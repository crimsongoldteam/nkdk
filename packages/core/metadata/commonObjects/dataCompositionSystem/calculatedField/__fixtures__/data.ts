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
