import { ConfigurationContext } from "~/metadata/context/types"

export function importBaseElementFromXML(_context: ConfigurationContext, xml: { _name: string }): { name: string } {
  return {
    name: xml._name,
  }
}
