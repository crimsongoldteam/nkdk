import { ConfigurationContext } from "~/metadata/context/types"
import { DynamicList, DynamicListEnterprise } from "./types"

export const exportDynamicListToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: DynamicList | undefined
): DynamicListEnterprise | undefined => {
  return data
}
