import { Context } from "../../context/types"
import { importSystemEnumerationFromEnterprise } from "../../systemEnumerations/importFromEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Picture, PictureEnterprise, PictureEnterpriseExtended } from "./types"

function isPictureEnterpriseExtended(data: PictureEnterprise): data is PictureEnterpriseExtended {
  return typeof data === "object" && data !== null && "Ссылка" in data && "Прозрачность" in data
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
  let loadTransparent = false

  if (isPictureEnterpriseExtended(data)) {
    ref = data.Ссылка as string
    loadTransparent = data.Прозрачность
  } else {
    ref = data as string
  }

  const standardPicture = tryImportStandardPicture(context, ref)
  if (standardPicture) {
    return createPicture(standardPicture, "StandardPicture", loadTransparent)
  }

  return createPicture(ref, "CommonPicture", loadTransparent)
}
