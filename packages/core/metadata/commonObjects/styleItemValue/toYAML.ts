import { ConfigurationContext } from "../../context/types"
import "../border/toYAML"
import "../color/toYAML"
import "../font/toYAML"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { exportPropertyToYAML } from "../../orchestration/property/toYAML"
import type { PropertyRule } from "../../orchestration/property/types"
import { BorderYAML } from "../border/types"
import { ColorYAML } from "../color/types"
import { FontYAML } from "../font/types"
import type { StyleItemValue, StyleItemValueYAML } from "./types"

const kindToYAML = {
  Font: "Шрифт",
  Color: "Цвет",
  Border: "Рамка",
} as const

const exportNestedValueToYAML = (
  context: ConfigurationContext,
  type: "Font" | "Color" | "Border",
  value: unknown
): unknown => {
  const yaml = exportPropertyToYAML({
    context,
    rule: { type, yaml: "Значение" },
    value,
  })?.Значение

  if (yaml === undefined || yaml === null || typeof yaml !== "object" || Array.isArray(yaml)) return yaml

  return Object.fromEntries(Object.entries(yaml).filter(([, nestedValue]) => nestedValue !== undefined))
}

export const exportStyleItemValueToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: StyleItemValue | undefined
): StyleItemValueYAML | undefined => {
  if (!value) return undefined

  if (value.type === "Font") {
    return {
      Вид: kindToYAML[value.type],
      Значение: exportNestedValueToYAML(context, value.type, value.value) as FontYAML,
    }
  }

  if (value.type === "Color") {
    return {
      Вид: kindToYAML[value.type],
      Значение: exportNestedValueToYAML(context, value.type, value.value) as ColorYAML,
    }
  }

  return {
    Вид: kindToYAML[value.type],
    Значение: exportNestedValueToYAML(context, value.type, value.value) as BorderYAML,
  }
}

registerTypeRule("StyleItemValue", "exportToYAML", exportStyleItemValueToYAML)
