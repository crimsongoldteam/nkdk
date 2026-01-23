import { ConfigurationContext } from "~/metadata/context/types"
import { DynamicList, DynamicListXML } from "./types"

export const exportDynamicListToXML = (
  _context: ConfigurationContext,
  data: DynamicList | undefined
): DynamicListXML | undefined => {
  return data
}
