import { ConfigurationContext } from "~/metadata/context/types"
import { DynamicList, DynamicListEnterprise } from "./types"

export const exportDynamicListToEnterprise = (
  _context: ConfigurationContext,
  data: DynamicList | undefined
): DynamicListEnterprise | undefined => {
  return data
}
