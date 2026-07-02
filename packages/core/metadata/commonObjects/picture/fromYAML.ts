import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { importSystemEnumerationFromYAMLDeprecated } from "../../systemEnumerations/fromYAML"
import * as SE from "../../systemEnumerations/types"
import { importBooleanFromYAML } from "../boolean/fromYAML"
import { parseMetadataTargetFromYAML, type MetadataTargetConstraint } from "../metadataTargets"
import { isRawPictureRefValue, type Picture, type PictureYAML, type PictureYAMLExtended } from "./types"

const commonPictureTarget = {
  kind: "object",
  allowedObjectPaths: [["CommonPicture"]],
} as const satisfies MetadataTargetConstraint

export const importPictureCombinedFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  picture: Picture | undefined,
  yaml: PictureYAML | undefined
): Picture | undefined => {
  if (picture === undefined && yaml === undefined) return undefined

  if (yaml === undefined) {
    return picture
  }

  const yamlPicture = importPictureFromYAML(context, undefined, yaml)!

  if (picture === undefined) {
    return yamlPicture
  }

  return {
    ...picture,
    ...yamlPicture,
  }
}

export const importPictureFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: PictureYAML | undefined
): Picture | undefined => {
  if (!data) return undefined

  let ref: string | SE.PictureLibYAML
  let loadTransparent: boolean
  let transparentPixel: { x: number; y: number } | undefined

  if (isPictureYAMLExtended(data)) {
    ref = data.Ссылка
    loadTransparent = importBooleanFromYAML(context, undefined, data.ПрозрачныйФон)!
    transparentPixel = data.ПрозрачныйПиксель
  } else {
    ref = data
    // First check if it's a standard picture to determine default loadTransparent
    const isStandard = tryimportStandardPicture(context, ref as string) !== undefined
    loadTransparent = isStandard ? true : false
  }

  if (typeof ref === "string" && isRawPictureRefValue(ref)) {
    return {
      rawRef: ref,
      ...(isPictureYAMLExtended(data) && data.ПрозрачныйФон !== undefined ? { loadTransparent } : {}),
      ...(transparentPixel ? { transparentPixel } : {}),
    }
  }

  const standardPicture = tryimportStandardPicture(context, ref as string)
  if (standardPicture) {
    return createPicture(standardPicture, "StandardPicture", loadTransparent, transparentPixel)
  }

  const commonPicture = typeof ref === "string" ? tryImportCommonPicture(ref) : undefined
  if (commonPicture) {
    return createPicture(commonPicture, "CommonPicture", loadTransparent, transparentPixel)
  }

  return createPicture(ref as string, "AbsolutePicture", loadTransparent, transparentPixel)
}

function isPictureYAMLExtended(data: PictureYAML): data is PictureYAMLExtended {
  return typeof data !== "string"
}

function tryimportStandardPicture(context: ConfigurationContext, ref: string): SE.PictureLib | undefined {
  if (ref in SE.PictureLibFromYAML) {
    return importSystemEnumerationFromYAMLDeprecated<SE.PictureLib>(
      context,
      { type: "SystemEnumeration", typeSE: "PictureLib" },
      ref
    )
  }
  return undefined
}

function tryImportCommonPicture(ref: string): string | undefined {
  if (!ref.startsWith("ОбщаяКартинка.")) return undefined

  const parsed = parseMetadataTargetFromYAML({
    value: ref,
    constraint: commonPictureTarget,
  })
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.target.kind === "object" && parsed.target.root === "CommonPicture"
    ? parsed.target.objectName
    : undefined
}

function createPicture(
  ref: string | SE.PictureLib,
  type: "StandardPicture" | "CommonPicture" | "AbsolutePicture",
  loadTransparent: boolean,
  transparentPixel?: { x: number; y: number }
): Picture {
  return { ref, type, loadTransparent, ...(transparentPixel ? { transparentPixel } : {}) }
}

registerTypeRule("Picture", "importFromYAML", importPictureFromYAML)
