import { ConfigurationContext } from "~/metadata/context/types"
import "../border/fromYAML"
import "../color/fromYAML"
import "../font/fromYAML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importPropertyFromYAML } from "~/metadata/orchestration/property/fromYAML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { Border } from "../border/types"
import { Color } from "../color/types"
import { Font } from "../font/types"
import { StyleItemValue, StyleItemValueYAML } from "./types"

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
