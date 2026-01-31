import * as SE from "../../systemEnumerations/types"
import { StringboolEnterprise } from "../boolean/types"

export interface PictureXML {
  "xr:Ref"?: string
  "xr:Abs"?: string
  "xr:LoadTransparent": boolean
  "xr:TransparentPixel"?: {
    _x: string | number
    _y: string | number
  }
}

export interface Picture {
  ref: string | SE.PictureLib
  type: "StandardPicture" | "CommonPicture" | "AbsolutePicture"
  loadTransparent: boolean
  transparentPixel?: {
    x: number
    y: number
  }
}

export type PictureEnterpriseRef = string | SE.PictureLibEnterprise

export interface PictureEnterpriseExtended {
  Ссылка: PictureEnterpriseRef
  ПрозрачныйФон?: StringboolEnterprise
  ПрозрачныйПиксель?: { x: number; y: number }
}

export type PictureEnterprise = PictureEnterpriseRef | PictureEnterpriseExtended

export interface PictureEnterprisePreview {
  type: "StandardPicture" | "CommonPicture" | "AbsolutePicture"
  value: string
}

export type PicturePreview = PictureEnterprisePreview
