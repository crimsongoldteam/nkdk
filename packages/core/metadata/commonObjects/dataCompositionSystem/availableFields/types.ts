export type AvailableFields = string[]

export type AvailableFieldsYAML = string[]

export type AvailableFieldXML = {
  "dcsset:field": string | { "#text"?: string }
}

export type AvailableFieldsXML = {
  "dcsset:item"?: AvailableFieldXML | AvailableFieldXML[]
}
