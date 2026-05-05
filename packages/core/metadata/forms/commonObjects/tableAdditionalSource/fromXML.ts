import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { TableAdditionalSourceXML } from "./types"

const importTableAdditionalSourceFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: TableAdditionalSourceXML | undefined
): string | undefined => {
  if (!xml) return undefined

  return xml.Item
}

registerTypeRule("TableAdditionalSource", "importFromXML", importTableAdditionalSourceFromXML)
