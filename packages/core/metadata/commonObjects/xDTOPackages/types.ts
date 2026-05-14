import { Static, Type } from "@sinclair/typebox"

export const XDTOPackagesJSONSchema = Type.Array(Type.String())
export type XDTOPackages = string[]
export type XDTOPackagesYAML = Static<typeof XDTOPackagesJSONSchema>

export interface XDTOPackageXMLItem {
  "xr:Presentation"?: string
  "xr:CheckState"?: number
  "xr:Value": {
    "_xsi:type": "xr:MDObjectRef" | "xs:string"
    "#text"?: string
  }
}

export interface XDTOPackagesXML {
  "xr:Item"?: XDTOPackageXMLItem | XDTOPackageXMLItem[]
}
