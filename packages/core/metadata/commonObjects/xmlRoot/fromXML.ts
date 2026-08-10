import { ConfigurationContextFromXML } from "../../context/types"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"

/** Маркерный обработчик: реальная работа выполняется единым обходом XML → YAML. */
export const importXMLRootFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  _xml: unknown
): undefined => {
  return undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("XMLRoot", "importFromXML", importXMLRootFromXML)
