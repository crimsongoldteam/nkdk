import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"

type NumberXML = number | string | { "#text"?: number | string } | undefined

export const importNumberFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: NumberXML
): number | undefined => {
  if (value === undefined) return undefined

  const rawValue =
    typeof value === "object" && value !== null && "#text" in value ? value["#text"] : value

  if (rawValue === undefined || rawValue === "") return undefined

  return typeof rawValue === "number" ? rawValue : Number(rawValue)
}

registerTypeRule("number", "importFromXML", importNumberFromXML)
