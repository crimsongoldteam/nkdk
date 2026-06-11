import { ConfigurationContextFromXML } from "~/metadata/context/types"
import "../border/fromXML"
import "../color/fromXML"
import "../font/fromXML"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { Border } from "../border/types"
import { Color } from "../color/types"
import { Font } from "../font/types"
import { StyleItemValue, StyleItemValueXML } from "./types"

export const importStyleItemValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: StyleItemValueXML | undefined
): StyleItemValue | undefined => {
  if (!value) return undefined

  if (value["_xsi:type"] === "v8ui:Font") {
    return {
      type: "Font",
      value: importPropertyFromXML({ context, rule: { type: "Font" }, value }) as Font,
    }
  }

  if (value["_xsi:type"] === "v8ui:Color") {
    return {
      type: "Color",
      value: importPropertyFromXML({ context, rule: { type: "Color" }, value: value["#text"] }) as Color,
    }
  }

  if (value["_xsi:type"] === "v8ui:Border") {
    return {
      type: "Border",
      value: importPropertyFromXML({ context, rule: { type: "Border" }, value }) as Border,
    }
  }

  throw new Error(`StyleItemValue: неподдержанный xsi:type ${String(value["_xsi:type"])}`)
}

registerTypeRule("StyleItemValue", "importFromXML", importStyleItemValueFromXML)
