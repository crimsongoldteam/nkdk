import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "../calendarField/rules"

export function importBaseElementFromXML(
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: { _name: string }
): { name: string } {
  return {
    name: xml._name,
  }
}
