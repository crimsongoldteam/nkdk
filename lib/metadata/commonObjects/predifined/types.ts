export interface Predefined {
  name: string
  code: string | number
  description: string
  isFolder: boolean
}

export interface PredefinedXML {
  Name: string
  Code: string | number
  Description: string
  IsFolder: boolean
}

export interface PredefinedEnterprise {
  Name: string
  Code: string | number
  Description: string
  IsFolder: boolean
}
export type PredefinedItems = Predefined[]
export type PredefinedItemsXML = PredefinedXML[]
export type PredefinedItemsEnterprise = PredefinedEnterprise[]
