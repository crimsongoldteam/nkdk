import { ConfigurationSettings } from "../../configurationSettings/types"
import { compactObject } from "../../helpers/compactObject"
import { Font, FontXML } from "./types"

export const importFontFromXML = (
  xml: FontXML | undefined,
  _configurationSettings: ConfigurationSettings
): Font | undefined => {
  if (!xml) return undefined
  return compactObject({
    ref: xml._ref,
    faceName: xml._faceName,
    scale: xml._scale,
    height: xml._height,
    bold: xml._bold,
    italic: xml._italic,
    underline: xml._underline,
    strikeout: xml._strikeout,
    kind: xml._kind,
  })
}
