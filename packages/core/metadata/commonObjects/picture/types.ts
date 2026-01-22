import * as SE from "../../systemEnumerations/types"
import { StringboolEnterprise } from "../boolean/types"

export interface PictureXML {
  "xr:Ref"?: string
  "xr:Abs"?: string
  "xr:LoadTransparent": boolean
}

export interface Picture {
  ref: string | SE.PictureLib
  type: "StandardPicture" | "CommonPicture" | "AbsolutePicture"
  loadTransparent: boolean
}

export type PictureEnterpriseRef = string | SE.PictureLibEnterprise

export interface PictureEnterpriseExtended {
  Ссылка: PictureEnterpriseRef
  ПрозрачныйФон: StringboolEnterprise
}

export type PictureEnterprise = PictureEnterpriseRef | PictureEnterpriseExtended
