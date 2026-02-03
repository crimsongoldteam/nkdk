import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { FunctionalOptions, FunctionalOptionsXML } from "./types"

export const _exportFunctionalOptionsToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FunctionalOptions | undefined
): FunctionalOptionsXML | undefined => {
  if (!data || data.length === 0) return undefined

  return {
    Item: data.length === 1 ? data[0] : data,
  }
}
