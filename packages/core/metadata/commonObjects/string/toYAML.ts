import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../context/types"

export const exportStringToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  value: string | number | undefined
): string | undefined => {
  if (value === undefined) return undefined
  return value.toString()
}

registerTypeRule("string", "exportToEnterprise", exportStringToYAML)
