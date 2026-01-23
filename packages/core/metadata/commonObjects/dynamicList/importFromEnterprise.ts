import { ConfigurationContext } from "~/metadata/context/types"
import { DynamicList, DynamicListEnterprise } from "./types"

export const importDynamicListFromEnterprise = (
  _context: ConfigurationContext,
  data: DynamicListEnterprise | undefined
): DynamicList | undefined => {
  return data as DynamicList
}
