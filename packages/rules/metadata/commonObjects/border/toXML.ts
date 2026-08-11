import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import type { Border, BorderXML } from "./types"

export const exportBorderToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  border: Border | undefined
): BorderXML | undefined => {
  if (!border) return undefined

  const result: BorderXML = {}

  if (border.ref !== undefined) {
    result._ref = `style:${border.ref}`
  }

  if (border.width !== undefined) {
    result._width = border.width
  }

  if (border.controlBorderType !== undefined) {
    result["v8ui:style"] = {
      "_xsi:type": "v8ui:ControlBorderType",
      "#text": border.controlBorderType,
    }
  }

  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("Border", "exportToXML", exportBorderToXML)
