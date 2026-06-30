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

export const fullOrderExpressionsFromCompactYAML: CalculatedFieldOrderExpression = [
  {
    itemType: "CalculatedFieldOrderExpression",
    expression: "Наименование",
    autoOrder: true,
  },
  {
    itemType: "CalculatedFieldOrderExpression",
    expression: "Ссылка",
    orderType: "Desc",
  },
]

export const fullOrderExpressionsYAML: CalculatedFieldOrderExpressionYAML = [
  {
    Выражение: "Наименование",
    Автоупорядочивание: "Истина",
  },
  {
    Выражение: "Ссылка",
    ТипУпорядочивания: "Убыв",
  },
]
