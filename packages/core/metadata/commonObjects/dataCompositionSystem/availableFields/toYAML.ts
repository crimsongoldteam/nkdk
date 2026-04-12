import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { AvailableFields, AvailableFieldsYAML } from "./types"

const exportAvailableFieldsToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AvailableFields | undefined
): AvailableFieldsYAML | undefined => {
  if (!data || data.length === 0) return undefined
  return data
}

registerTypeRule("AvailableFields", "exportToYAML", exportAvailableFieldsToYAML)
