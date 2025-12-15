import { IndexField, IndexFieldXML } from "./types"

export const exportIndexFieldToXML = (data: IndexField | undefined): IndexFieldXML | undefined => {
  if (!data) return undefined

  return {
    Name: data,
  }
}
