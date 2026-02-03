import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { IndexFieldXML } from "./types"

export const _exportIndexFieldToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: IndexFieldXML | undefined
): string | undefined => {
  if (!xml) return undefined

  return xml.Name
}
