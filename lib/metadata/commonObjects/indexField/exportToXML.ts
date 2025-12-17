import { IndexField, IndexFields, IndexFieldsXML, IndexFieldXML } from "./types"

export function exportIndexFieldToXML(data: IndexField): IndexFieldXML
export function exportIndexFieldToXML(data: undefined): undefined
export function exportIndexFieldToXML(data: IndexField | undefined): IndexFieldXML | undefined {
  if (!data) return undefined

  return { Name: data }
}

export function exportIndexFieldsToXML(data: IndexFields | undefined): IndexFieldsXML | undefined {
  if (!data) return undefined

  return data.map((value) => exportIndexFieldToXML(value))
}
