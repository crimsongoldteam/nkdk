import { ConfigurationContext } from "~/metadata/context/types"
import { UseAlways, UseAlwaysXML } from "./types"

export const importUseAlwaysFromXML = (
  _context: ConfigurationContext,
  xml: UseAlwaysXML | undefined
): UseAlways | undefined => {
  if (!xml || !xml.Field) return undefined

  return Array.isArray(xml.Field) ? xml.Field : [xml.Field]
}
