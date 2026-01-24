import { ConfigurationContext } from "~/metadata/context/types"
import { UseAlways, UseAlwaysXML } from "./types"

export const exportUseAlwaysToXML = (
  _context: ConfigurationContext,
  data: UseAlways | undefined
): UseAlwaysXML | undefined => {
  if (!data || data.length === 0) return undefined

  return {
    Field: data,
  }
}
