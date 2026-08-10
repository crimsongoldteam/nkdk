import { ConfigurationContext } from "../../context/types"
import "../border/fromYAML"
import "../color/fromYAML"
import "../font/fromYAML"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { callAtomicFromYAML } from "../../ruleRuntime/property/fromYAMLToXML"
import type { PropertyRule } from "../../ruleRuntime/property/types"
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
      value: callAtomicFromYAML({ context, rule: { type }, value: value.Значение }) as Font,
    }
  }

  if (type === "Color") {
    return {
      type,
      value: callAtomicFromYAML({ context, rule: { type }, value: value.Значение }) as Color,
    }
  }

  return {
    type,
    value: callAtomicFromYAML({ context, rule: { type }, value: value.Значение }) as Border,
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("StyleItemValue", "importFromYAML", importStyleItemValueFromYAML)
