import * as SE from "../../systemEnumerations/types"

export interface PictureXML {
  "xr:Ref": string
  "xr:LoadTransparent": boolean
}

export interface Picture {
  ref: string | SE.PictureLib
  type: "StandardPicture" | "CommonPicture"
  loadTransparent: boolean
}

export type PictureEnterpriseRef = string | SE.PictureLibEnterprise

export interface PictureEnterpriseExtended {
  Ссылка: PictureEnterpriseRef
  Прозрачность: boolean
}

export type PictureEnterprise = PictureEnterpriseRef | PictureEnterpriseExtended
