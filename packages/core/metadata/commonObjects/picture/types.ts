import * as SE from "../../systemEnumerations/types"
import { StringboolYAML } from "../boolean/types"

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

export type PictureYAMLRef = string | SE.PictureLibYAML

export interface PictureYAMLExtended {
  Ссылка: PictureYAMLRef
  ПрозрачныйФон?: StringboolYAML
  ПрозрачныйПиксель?: { x: number; y: number }
}

export type PictureYAML = PictureYAMLRef | PictureYAMLExtended

// #region Enterprise

export interface PredifinedPictureEnterprise {
  Type: "Picture"
  Value: string
}

export interface AbsolutePictureEnterprise {
  Type: "AbsolutePicture"
}

export type PictureEnterprise = PredifinedPictureEnterprise | AbsolutePictureEnterprise

// #endregion Enterprise
