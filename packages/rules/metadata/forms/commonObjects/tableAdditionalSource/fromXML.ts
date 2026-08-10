import { ConfigurationContextFromXML } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
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

export const metadataPropertyRule000 = definePropertyTypeRule("TableAdditionalSource", "importFromXML", importTableAdditionalSourceFromXML)
