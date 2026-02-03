import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { StringboolXML } from "./types"

export const _importBooleanFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: StringboolXML | undefined
): boolean | undefined => {
  if (xml === undefined) return undefined

  return xml === "true" ? true : xml === "false" ? false : xml
}
