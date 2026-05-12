import type { DcsAvailableValues, DcsAvailableValuesYAML } from "../types"

export const stringAvailableValues = [
  {
    itemType: "DcsAvailableValue",
    value: { type: "string", value: "Выставлен" },
    presentation: { items: { ru: "Выставлен" } },
  },
  {
    itemType: "DcsAvailableValue",
    value: { type: "string", value: "Аннулирован" },
    presentation: { items: { ru: "Аннулирован" } },
  },
] satisfies DcsAvailableValues

export const stringAvailableValuesYAML = [
  { Значение: '"Выставлен"', Представление: "Выставлен" },
  { Значение: '"Аннулирован"', Представление: "Аннулирован" },
] satisfies DcsAvailableValuesYAML

export const nilAndBooleanAvailableValues = [
  { itemType: "DcsAvailableValue" },
  { itemType: "DcsAvailableValue", value: { type: "boolean", value: true } },
] satisfies DcsAvailableValues

export const nilAndBooleanAvailableValuesYAML = [{}, { Значение: "Истина" }] satisfies DcsAvailableValuesYAML
