import { ConfigurationContext } from "../../context/types"
import { importSystemEnumerationFromEnterprise } from "../../systemEnumerations/importFromEnterprise"
import * as SE from "../../systemEnumerations/types"
import { importBooleanFromEnterprise } from "../boolean/importFromEnterprise"
import { Picture, PictureEnterprise, PictureEnterpriseExtended } from "./types"

function isPictureEnterpriseExtended(data: PictureEnterprise): data is PictureEnterpriseExtended {
  return typeof data !== "string"
}

function tryImportStandardPicture(context: ConfigurationContext, ref: string): SE.PictureLib | undefined {
  if (ref in SE.PictureLibFromEnterprise) {
    return importSystemEnumerationFromEnterprise(context, ref, SE.PictureLibFromEnterprise)
  }
  return undefined
}

function createPicture(
  ref: string | SE.PictureLib,
  type: "StandardPicture" | "CommonPicture" | "AbsolutePicture",
  loadTransparent: boolean,
  transparentPixel?: { x: number; y: number }
): Picture {
  return { ref, type, loadTransparent, transparentPixel }
}

export const importPictureFromEnterprise = (
  context: ConfigurationContext,
  data: PictureEnterprise | undefined
): Picture | undefined => {
  if (!data) return undefined

  let ref: string | SE.PictureLibEnterprise
  let loadTransparent: boolean
  let transparentPixel: { x: number; y: number } | undefined

  if (isPictureEnterpriseExtended(data)) {
    ref = data.Ссылка
    loadTransparent = importBooleanFromEnterprise(context, data.ПрозрачныйФон)!
    transparentPixel = data.ПрозрачныйПиксель
  } else {
    ref = data
    // First check if it's a standard picture to determine default loadTransparent
    const isStandard = tryImportStandardPicture(context, ref as string) !== undefined
    loadTransparent = isStandard ? true : false
  }

  const standardPicture = tryImportStandardPicture(context, ref as string)
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
