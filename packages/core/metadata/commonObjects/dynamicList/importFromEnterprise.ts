import { ConfigurationContext } from "~/metadata/context/types"
import { DynamicList, DynamicListEnterprise } from "./types"

export const importDynamicListFromEnterprise = (
  _context: ConfigurationContext,
  data: DynamicListEnterprise | undefined
): DynamicList | undefined => {
  if (!data || !data.Settings) return undefined

  // Enterprise format is the same as DynamicList format
  return data as DynamicList
}
