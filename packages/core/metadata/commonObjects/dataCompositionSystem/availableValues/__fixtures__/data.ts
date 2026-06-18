import type { DcsAvailableValues, DcsAvailableValuesYAML } from "../types"
import { explicitYAMLString } from "~/yaml/explicitString"

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
  { Значение: explicitYAMLString("Выставлен"), Представление: "Выставлен" },
  { Значение: explicitYAMLString("Аннулирован"), Представление: "Аннулирован" },
] satisfies DcsAvailableValuesYAML

export const nilAndBooleanAvailableValues = [
  { itemType: "DcsAvailableValue" },
  { itemType: "DcsAvailableValue", value: { type: "boolean", value: true } },
] satisfies DcsAvailableValues

export const nilAndBooleanAvailableValuesYAML = [{}, { Значение: "Истина" }] satisfies DcsAvailableValuesYAML
