import { ConfigurationContextWithExportToXML } from "../../context/types"
import "../border/toXML"
import "../color/toXML"
import "../font/toXML"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { callAtomicToXML } from "../../orchestration/property/fromYAMLToXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { BorderXML } from "../border/types"
import { ColorXML } from "../color/types"
import { FontXML } from "../font/types"
import type { StyleItemValue, StyleItemValueXML } from "./types"

export const exportStyleItemValueToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  value: StyleItemValue | undefined
): StyleItemValueXML | undefined => {
  if (!value) return undefined

  if (value.type === "Font") {
    const xml = callAtomicToXML({ context, rule: { type: "Font" }, value: value.value }) as FontXML
    return { "_xsi:type": "v8ui:Font", ...xml }
  }

  if (value.type === "Color") {
    const xml = callAtomicToXML({ context, rule: { type: "Color" }, value: value.value }) as ColorXML
    return { "_xsi:type": "v8ui:Color", "#text": xml }
  }

  const xml = callAtomicToXML({ context, rule: { type: "Border" }, value: value.value }) as BorderXML
  return { "_xsi:type": "v8ui:Border", ...xml }
}

registerTypeRule("StyleItemValue", "exportToXML", exportStyleItemValueToXML)
