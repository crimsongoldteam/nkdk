import { ConfigurationContext } from "~/metadata/context/types"
import { DynamicList, DynamicListEnterprise } from "./types"

export const exportDynamicListToEnterprise = (
  _context: ConfigurationContext,
  data: DynamicList | undefined
): DynamicListEnterprise | undefined => {
  if (!data || !data.Settings) return undefined

  // Enterprise format is the same as DynamicList format
  return data as DynamicListEnterprise
}
