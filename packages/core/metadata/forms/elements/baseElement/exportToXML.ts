import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, BaseElementXML } from "./types"

export const exportBaseElementToXML = (
  _context: ConfigurationContext,
  data: BaseElement | undefined
): BaseElementXML | undefined => {
  if (!data) return undefined
  return {
    _name: data.name,
    _id: data.id ?? "",
  }
}
