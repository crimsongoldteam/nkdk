export type AvailableFields = string[]

export type AvailableFieldsYAML = string[]

export type AvailableFieldXML = {
  "dcsset:field": string
}

export type AvailableFieldsXML = {
  "dcsset:item"?: AvailableFieldXML | AvailableFieldXML[]
}
