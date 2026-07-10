import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
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

registerTypeRule("Border", "exportToXML", exportBorderToXML)
