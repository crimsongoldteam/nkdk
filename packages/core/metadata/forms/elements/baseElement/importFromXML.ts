import { ConfigurationContext } from "~/metadata/context/types"

export function importBaseElementFromXML(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: { _name: string }
): { name: string } {
  return {
    name: xml._name,
  }
}
