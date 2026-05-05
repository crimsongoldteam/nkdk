import type { CalculatedFieldUseRestriction, CalculatedFieldUseRestrictionYAML } from "../types"

export const fullUseRestriction: CalculatedFieldUseRestriction = {
  itemType: "CalculatedFieldUseRestriction",
  field: true,
  condition: true,
  group: true,
  order: true,
}

export const fullUseRestrictionYAML: CalculatedFieldUseRestrictionYAML = {
  Поле: "Истина",
  Условие: "Истина",
  Группировка: "Истина",
  Порядок: "Истина",
}
