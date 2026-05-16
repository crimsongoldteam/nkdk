import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { importSystemEnumerationFromYAMLDeprecated } from "../../systemEnumerations/fromYAML"
import * as SE from "../../systemEnumerations/types"
import { importBooleanFromYAML } from "../boolean/fromYAML"
import { Picture, PictureYAML, PictureYAMLExtended } from "./types"

const rawPictureRefPattern = /^0(?::[0-9a-fA-F-]+)?$/

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

  if (typeof ref === "string" && rawPictureRefPattern.test(ref)) {
    return { rawRef: ref }
  }

  const standardPicture = tryimportStandardPicture(context, ref as string)
  if (standardPicture) {
    return createPicture(standardPicture, "StandardPicture", loadTransparent, transparentPixel)
  }

  // Determine if it's absolute or common picture
  // Absolute pictures typically have file extensions
  const isAbsolute = typeof ref === "string" && /\.\w+$/.test(ref)

  return createPicture(
    ref as string,
    isAbsolute ? "AbsolutePicture" : "CommonPicture",
    loadTransparent,
    transparentPixel
  )
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

function createPicture(
  ref: string | SE.PictureLib,
  type: "StandardPicture" | "CommonPicture" | "AbsolutePicture",
  loadTransparent: boolean,
  transparentPixel?: { x: number; y: number }
): Picture {
  return { ref, type, loadTransparent, ...(transparentPixel ? { transparentPixel } : {}) }
}

registerTypeRule("Picture", "importFromYAML", importPictureFromYAML)
