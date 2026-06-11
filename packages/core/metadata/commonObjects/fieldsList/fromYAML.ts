import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { FieldsList, FieldsListYAML } from "./types"

export const importFieldsListFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  enterprise: FieldsListYAML | undefined
): FieldsList | undefined => {
  if (!enterprise || enterprise.length === 0) return undefined

  return enterprise
}

registerTypeRule("FieldsList", "importFromYAML", importFieldsListFromYAML)
