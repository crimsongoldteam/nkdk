export interface ITypeLinkXML {
  "xr:DataPath": string
  "xr:LinkItem": number
}

export interface ITypeLink {
  dataPath: string
  linkItem: string | number
}

export type TTypeLinkXML = ITypeLinkXML
export type TTypeLink = ITypeLink
