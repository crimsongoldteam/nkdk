import { Context } from "~/lib/metadata/context/types"
import { BaseElement, BaseElementXML } from "./types"

export const exportBaseElementToXML = (
  _context: Context,
  data: BaseElement | undefined
): BaseElementXML | undefined => {
  if (!data) return undefined
  return {
    _id: data.id ?? "",
    _name: data.name,
  }
}
