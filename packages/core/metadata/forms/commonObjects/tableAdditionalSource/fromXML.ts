import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/metadataFactory"
import { TableAdditionalSourceXML } from "./types"

const importTableAdditionalSourceFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: TableAdditionalSourceXML | undefined
): string | undefined => {
  if (!xml) return undefined

  return xml.Item
}

registerTypeRule("TableAdditionalSource", "importFromXML", importTableAdditionalSourceFromXML)
