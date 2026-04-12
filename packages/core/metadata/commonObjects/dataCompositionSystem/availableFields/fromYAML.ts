import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { AvailableFields, AvailableFieldsYAML } from "./types"

const importAvailableFieldsFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: AvailableFieldsYAML | undefined
): AvailableFields | undefined => {
  if (!yaml) return undefined

  const fields = yaml.map(String).filter(Boolean)
  return fields.length > 0 ? fields : undefined
}

registerTypeRule("AvailableFields", "importFromYAML", importAvailableFieldsFromYAML)
