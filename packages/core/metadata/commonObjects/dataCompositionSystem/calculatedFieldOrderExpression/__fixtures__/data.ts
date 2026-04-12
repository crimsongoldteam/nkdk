import type { CalculatedFieldOrderExpression, CalculatedFieldOrderExpressionYAML } from "../types"

export const fullOrderExpressions: CalculatedFieldOrderExpression = [
  {
    itemType: "CalculatedFieldOrderExpression",
    expression: "Наименование",
    orderType: "Asc",
    autoOrder: true,
  },
  {
    itemType: "CalculatedFieldOrderExpression",
    expression: "Ссылка",
    orderType: "Desc",
    autoOrder: false,
  },
]

export const fullOrderExpressionsYAML: CalculatedFieldOrderExpressionYAML = [
  {
    Выражение: "Наименование",
    ТипУпорядочивания: "Возр",
    Автоупорядочивание: "Истина",
  },
  {
    Выражение: "Ссылка",
    ТипУпорядочивания: "Убыв",
    Автоупорядочивание: "Ложь",
  },
]
