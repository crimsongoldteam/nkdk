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
  Код: string | number
  Наименование: string
  ЭтоГруппа: boolean
}

export type PredefinedItems = Predefined[]
export type PredefinedItemsXML = PredefinedXML[]
export type PredefinedItemsEnterprise = Map<string, PredefinedEnterprise>
