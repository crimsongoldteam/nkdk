import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { StringboolXML } from "./types"

export const importBooleanFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: StringboolXML | { "#text"?: StringboolXML; [key: string]: unknown } | undefined
): boolean | undefined => {
  if (xml === undefined) return undefined

  const value = typeof xml === "object" && xml !== null && "#text" in xml ? xml["#text"] : xml

  return value === "true" || value === true ? true : value === "false" || value === false ? false : undefined
}

registerTypeRule("boolean", "importFromXML", importBooleanFromXML)
