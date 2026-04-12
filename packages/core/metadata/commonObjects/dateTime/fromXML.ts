import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"

type DateTimeXML = string | { "#text"?: string; "_xsi:type"?: string } | undefined

export const importDateTimeFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: DateTimeXML
): string | undefined => {
  if (value === undefined) return undefined

  const rawValue = typeof value === "object" && value !== null && "#text" in value ? value["#text"] : value
  if (rawValue === undefined || rawValue === "") return undefined

  return String(rawValue)
}

registerTypeRule("dateTime", "importFromXML", importDateTimeFromXML)
