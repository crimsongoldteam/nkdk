import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import type { PropertyRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration"

export const importChildFileItemNamesFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): string[] | undefined => {
  if (xml === undefined || xml === null) return undefined
  const names = Array.isArray(xml) ? xml.filter((item): item is string => typeof item === "string") : [xml]
  return names.length > 0 && names.every((item) => typeof item === "string") ? names : undefined
}

registerTypeRule("ChildFileItemNames", "importFromXML", importChildFileItemNamesFromXML)
