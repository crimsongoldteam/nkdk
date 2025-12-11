import { TPictureLib, TPictureLibEnterprise } from "../../systemSets/types"

export interface PictureXML {
  "xr:Ref": string
  "xr:LoadTransparent": boolean
}

export interface Picture {
  ref: string | TPictureLib
  type: "StandardPicture" | "CommonPicture"
  loadTransparent: boolean
}

export type PictureEnterprise = string | TPictureLibEnterprise
