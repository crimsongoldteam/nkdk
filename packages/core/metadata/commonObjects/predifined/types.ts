import { Static, Type } from "@sinclair/typebox"

export interface Predefined {
  id?: string
  name: string
  code: string | number
  description: string
  isFolder: boolean
}

export interface PredefinedXML {
  _id?: string
  Name: string
  Code: string | number
  Description: string
  IsFolder: boolean
}

export const PredefinedYAMLJSONSchema = Type.Object({
  Код: Type.Union([Type.String(), Type.Number()]),
  Наименование: Type.String(),
  ЭтоГруппа: Type.Boolean(),
})

export interface PredefinedYAML {
  Код: string | number
  Наименование: string
  ЭтоГруппа: boolean
}

export type PredefinedItems = Predefined[]
export type PredefinedItemsXML = PredefinedXML[]
export const PredefinedItemsYAMLJSONSchema = Type.Record(Type.String(), PredefinedYAMLJSONSchema)
export type PredefinedItemsYAML = Static<typeof PredefinedItemsYAMLJSONSchema>
