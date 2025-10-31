import { TBaseElement, TBaseElementXML } from "./types"

export const exportBaseElementToXML = (data: TBaseElement | undefined): TBaseElementXML | undefined => {
  if (!data) return undefined
  return {
    _id: data.id ?? "",
    _name: data.name,
  }
}
