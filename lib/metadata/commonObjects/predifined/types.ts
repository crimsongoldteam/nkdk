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
export type PredefinedList = Predefined[]
export type PredefinedListXML = PredefinedXML[]
export type PredefinedListEnterprise = PredefinedEnterprise[]
