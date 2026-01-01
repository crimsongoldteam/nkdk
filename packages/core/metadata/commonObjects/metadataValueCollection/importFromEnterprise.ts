import { Context } from "../../context/types"
import { importMetadataRefFromEnterprise } from "../metadataValue/importFromEnterprise"
import { MetadataValueCollection, MetadataValueCollectionEnterprise } from "./types"

export const importMetadataValueCollectionFromEnterprise = (
  context: Context,
  data: MetadataValueCollectionEnterprise | undefined
): MetadataValueCollection | undefined => {
  if (!data || data.length === 0) return undefined

  return data.map((item) => {
    const metadataValue = importMetadataRefFromEnterprise(context, item)
    return metadataValue.value as string
  })
}
