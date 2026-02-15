import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../context/types"
import { Border, BorderXML } from "./types"

export const exportBorderToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  border: Border | undefined
): BorderXML | undefined => {
  if (!border) return undefined

  const result: BorderXML = {}

  if (border.ref !== undefined) {
    result._ref = border.ref
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
