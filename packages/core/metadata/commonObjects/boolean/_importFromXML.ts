import { ConfigurationContext } from "../../context/types"
import { StringboolXML } from "./types"

export const importOldBooleanFromXML = (
  _context: ConfigurationContext,
  xml: StringboolXML | undefined
): boolean | undefined => {
  if (xml === undefined) return undefined

  return xml === "true" ? true : xml === "false" ? false : xml
}
