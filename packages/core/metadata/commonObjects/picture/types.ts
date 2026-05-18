import { Static, Type } from "@sinclair/typebox"
import * as SE from "../../systemEnumerations/types"
import { BooleanJSONSchema, StringboolYAML } from "../boolean/types"

export interface PictureXML {
  "xr:Ref"?: string
  "xr:Abs"?: string
  "xr:LoadTransparent"?: boolean
  "xr:TransparentPixel"?: {
    _x: string | number
    _y: string | number
  }
}

export type RawPictureRef = {
  rawRef: string
  loadTransparent?: boolean
  transparentPixel?: {
    x: number
    y: number
  }
}

export interface LinkedPicture {
  ref: string | SE.PictureLib
  type: "StandardPicture" | "CommonPicture" | "AbsolutePicture"
  loadTransparent: boolean
  transparentPixel?: {
    x: number
    y: number
  }
}

export type Picture = LinkedPicture | RawPictureRef

export function isRawPictureRef(picture: Picture): picture is RawPictureRef {
  return "rawRef" in picture
}

const rawPictureRefPattern = /^0(?::[0-9a-fA-F-]+)?$/

export function isRawPictureRefValue(ref: string): boolean {
  return rawPictureRefPattern.test(ref)
}

export type PictureYAMLRef = string | SE.PictureLibYAML

export interface PictureYAMLExtended {
  Ссылка: PictureYAMLRef
  ПрозрачныйФон?: StringboolYAML
  ПрозрачныйПиксель?: { x: number; y: number }
}

export const PictureJSONSchema = Type.Union([
  Type.String(),
  Type.Object({
    Ссылка: Type.Union([Type.String()]),
    ПрозрачныйФон: Type.Optional(BooleanJSONSchema),
    ПрозрачныйПиксель: Type.Optional(Type.Object({ x: Type.Number(), y: Type.Number() })),
  }),
])

export type PictureYAML = Static<typeof PictureJSONSchema>

// #region Enterprise

export interface PredifinedPictureEnterprise {
  Type: "Picture"
  Value?: `PictureLib.${SE.PictureLib}` | string
}

export interface AbsolutePictureEnterprise {
  Type: "AbsolutePicture"
}

export type PictureEnterprise = PredifinedPictureEnterprise | AbsolutePictureEnterprise

// #endregion Enterprise
