import { ConfigurationContextFromXML } from "../../../context/types"
import { PropertyRule, registerTypeRule } from "../../../orchestration"
import { TableAdditionalSourceXML } from "./types"

const importTableAdditionalSourceFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: TableAdditionalSourceXML | undefined
): string | undefined => {
  if (!xml) return undefined

  if (context.fromXML.forReference) return ""

  return xml.Item
}

registerTypeRule("TableAdditionalSource", "importFromXML", importTableAdditionalSourceFromXML)
