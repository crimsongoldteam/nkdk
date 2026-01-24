import { ConfigurationContext } from "~/metadata/context/types"
import { FunctionalOptions, FunctionalOptionsXML } from "./types"

export const importFunctionalOptionsFromXML = (
  _context: ConfigurationContext,
  xml: FunctionalOptionsXML | undefined
): FunctionalOptions | undefined => {
  if (!xml || !xml.Item) return undefined

  return Array.isArray(xml.Item) ? xml.Item : [xml.Item]
}
