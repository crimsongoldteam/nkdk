import { IndexField, IndexFields, IndexFieldsXML, IndexFieldXML } from "./types"

export function importIndexFieldFromXML(xml: IndexFieldXML): IndexField
export function importIndexFieldFromXML(xml: undefined): undefined
export function importIndexFieldFromXML(xml: IndexFieldXML | undefined): IndexField | undefined {
  if (!xml) return undefined

  return xml.Name
}

export function importIndexFieldsFromXML(xml: IndexFieldsXML): IndexFields
export function importIndexFieldsFromXML(xml: undefined): undefined
export function importIndexFieldsFromXML(xml: IndexFieldsXML | undefined): IndexFields | undefined {
  if (!xml) return undefined

  return xml.map((value) => importIndexFieldFromXML(value))
}
