import { BaseElement, BaseElementXML } from "./types"

export const exportBaseElementToXML = (data: BaseElement | undefined): BaseElementXML | undefined => {
  if (!data) return undefined
  return {
    _id: data.id ?? "",
    _name: data.name,
  }
}
