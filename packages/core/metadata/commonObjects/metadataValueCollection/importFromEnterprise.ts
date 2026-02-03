import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { importMetadataRefFromEnterprise } from "../metadataValue/importFromEnterprise"
import { MetadataValueCollection, MetadataValueCollectionEnterprise } from "./types"

export const importMetadataValueCollectionFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValueCollectionEnterprise | undefined
): MetadataValueCollection | undefined => {
  if (!data || data.length === 0) return undefined

  return data.map((item) => {
    const metadataValue = importMetadataRefFromEnterprise(context, undefined, item)
    return metadataValue.value as string
  })
}
