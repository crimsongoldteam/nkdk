import { Context } from "../../context/types"
import { exportMetadataFieldToEnterprise } from "../metadataField/exportToEnterprise"
import { TypeLink, TypeLinkEnterprise } from "./types"

export const exportTypeLinkToEnterprise = (
  context: Context,
  data: TypeLink | undefined
): TypeLinkEnterprise | undefined => {
  if (!data) return undefined

  const dataPathEnterprise = exportMetadataFieldToEnterprise(context, data.dataPath)
  if (!dataPathEnterprise) return undefined

  // Добавляем linkItem в скобках, если он не равен 0
  if (data.linkItem !== 0) {
    return `${dataPathEnterprise}(${data.linkItem})`
  }

  return dataPathEnterprise
}
