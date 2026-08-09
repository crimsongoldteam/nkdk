import { Type } from "typebox"
import type { Static } from "typebox"
import * as SE from "../../systemEnumerations/types"
import { BooleanJSONSchema, StringboolYAML } from "../boolean/types"
import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

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

const PictureRefJSONSchema = Type.String({
  examples: ["БизнесПроцесс", "ОбщаяКартинка.Логотип", "Picture.png"],
  description: "Стандартная картинка, ссылка на общую картинку вида ОбщаяКартинка.<ИмяОбщейКартинки> или путь к файлу.",
})

export const PictureJSONSchema = Type.Union([
  PictureRefJSONSchema,
  Type.Object({
    Ссылка: PictureRefJSONSchema,
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

export interface PictureWidePropertyRule extends WidePropertyRuleBase {
  type: "Picture"
}

export type PictureRuleParams = Omit<PictureWidePropertyRule, "type">

export function pictureRule<const Params extends PictureRuleParams>(
  params: WideExactRuleParams<PictureRuleParams, Params>
): Readonly<{ type: "Picture" } & Params> {
  return defineWidePropertyRule("Picture", params)
}
