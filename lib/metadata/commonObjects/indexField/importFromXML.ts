import { IndexField, IndexFieldXML } from "./types"

export const importIndexFieldFromXML = (xml: IndexFieldXML | undefined): IndexField | undefined => {
  if (!xml) return undefined

  return xml.Name
}
