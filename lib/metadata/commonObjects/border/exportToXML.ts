import { ConfigurationSettings } from "../../configurationSettings/types"
import { Border, BorderXML } from "./types"

export const exportBorderToXML = (
  border: Border | undefined,
  _configurationSettings: ConfigurationSettings
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
