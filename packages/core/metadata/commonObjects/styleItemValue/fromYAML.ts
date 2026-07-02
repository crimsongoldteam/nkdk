import { ConfigurationContext } from "../../context/types"
import "../border/fromYAML"
import "../color/fromYAML"
import "../font/fromYAML"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { importPropertyFromYAML } from "../../orchestration/property/fromYAML"
import type { PropertyRule } from "../../orchestration/property/types"
import { Border } from "../border/types"
import { Color } from "../color/types"
import { Font } from "../font/types"
import type { StyleItemValue, StyleItemValueYAML } from "./types"

const kindFromYAML = {
  Шрифт: "Font",
  Цвет: "Color",
  Рамка: "Border",
} as const

export const importStyleItemValueFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: StyleItemValueYAML | undefined
): StyleItemValue | undefined => {
  if (!value) return undefined

  const type = kindFromYAML[value.Вид]
  if (type === undefined) {
    throw new Error(`StyleItemValue: неподдержанный Вид ${String(value.Вид)}`)
  }

  if (type === "Font") {
    return {
      type,
      value: importPropertyFromYAML({ context, rule: { type }, value: value.Значение }) as Font,
    }
  }

  if (type === "Color") {
    return {
      type,
      value: importPropertyFromYAML({ context, rule: { type }, value: value.Значение }) as Color,
    }
  }

  return {
    type,
    value: importPropertyFromYAML({ context, rule: { type }, value: value.Значение }) as Border,
  }
}

registerTypeRule("StyleItemValue", "importFromYAML", importStyleItemValueFromYAML)
