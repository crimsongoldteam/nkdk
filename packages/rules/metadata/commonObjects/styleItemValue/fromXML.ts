import { ConfigurationContextFromXML, isEmptyXmlElement, xmlAttributeValue, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import "../border/fromXML"
import "../color/fromXML"
import "../font/fromXML"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { importPropertyFromXML } from "../../ruleRuntime/property/fromXML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { Border } from "../border/types"
import { Color } from "../color/types"
import { Font } from "../font/types"
import type { StyleItemValue } from "./types"

export const importStyleItemValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: XmlElementNode | undefined
): StyleItemValue | undefined => {
  if (!value) return undefined
  if (isEmptyXmlElement(value)) return undefined
  const xsiType = xmlAttributeValue(value, "xsi:type")

  if (xsiType === "v8ui:Font") {
    return {
      type: "Font",
      value: importPropertyFromXML({ context, rule: { type: "Font" }, value }) as Font,
    }
  }

  if (xsiType === "v8ui:Color") {
    return {
      type: "Color",
      value: importPropertyFromXML({ context, rule: { type: "Color" }, value: xmlTextValue(value) || undefined }) as Color,
    }
  }

  if (xsiType === "v8ui:Border") {
    return {
      type: "Border",
      value: importPropertyFromXML({ context, rule: { type: "Border" }, value }) as Border,
    }
  }

  throw new Error(`StyleItemValue: неподдержанный xsi:type ${String(xsiType)}`)
}

export const metadataPropertyRule000 = definePropertyTypeRule("StyleItemValue", "importFromXML", importStyleItemValueFromXML)
