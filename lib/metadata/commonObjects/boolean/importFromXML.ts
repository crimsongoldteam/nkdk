import { Context } from "../../context/types"
import { StringboolXML } from "./types"

export const importBooleanFromXML = (
  _configurationSettings: Context,
  xml: StringboolXML | undefined
): boolean | undefined => {
  if (xml === undefined) return undefined

  return xml === "true" ? true : xml === "false" ? false : xml
}
