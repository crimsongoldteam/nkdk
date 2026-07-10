import { ConfigurationContextFromXML } from "../../context/types"
import { PropertyRule, registerTypeRule } from "../../orchestration"

/** Импортирует список имён макетов из XML-тегов Template в ChildObjects. */
export const importChildTemplateNamesFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): string[] | undefined => {
  if (xml === undefined || xml === null) return undefined
  if (Array.isArray(xml)) return xml.length > 0 ? xml : undefined
  return [xml as string]
}

registerTypeRule("ChildTemplateNames", "importFromXML", importChildTemplateNamesFromXML)
