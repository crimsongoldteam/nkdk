import { Context } from "../../context/types"
import { importSystemEnumerationFromEnterprise } from "../../systemEnumerations/importFromEnterprise"
import * as SE from "../../systemEnumerations/types"
import { importBooleanFromEnterprise } from "../boolean/importFromEnterprise"
import { Picture, PictureEnterprise, PictureEnterpriseExtended } from "./types"

function isPictureEnterpriseExtended(data: PictureEnterprise): data is PictureEnterpriseExtended {
  return typeof data !== "string"
}

function tryImportStandardPicture(context: Context, ref: string): SE.PictureLib | undefined {
  if (ref in SE.PictureLibFromEnterprise) {
    return importSystemEnumerationFromEnterprise(context, ref, SE.PictureLibFromEnterprise)
  }
  return undefined
}

function createPicture(
  ref: string | SE.PictureLib,
  type: "StandardPicture" | "CommonPicture",
  loadTransparent: boolean
): Picture {
  return { ref, type, loadTransparent }
}

export const importPictureFromEnterprise = (
  context: Context,
  data: PictureEnterprise | undefined
): Picture | undefined => {
  if (!data) return undefined

  let ref: string
  let loadTransparent = true

  if (isPictureEnterpriseExtended(data)) {
    ref = data.Ссылка as string
    loadTransparent = importBooleanFromEnterprise(context, data.ПрозрачныйФон)!
  } else {
    ref = data as string
  }

  const standardPicture = tryImportStandardPicture(context, ref)
  if (standardPicture) {
    return createPicture(standardPicture, "StandardPicture", loadTransparent)
  }

  return createPicture(ref, "CommonPicture", loadTransparent)
}
