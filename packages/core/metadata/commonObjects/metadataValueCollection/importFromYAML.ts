import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { importMetadataRefFromYAML } from "../metadataValue/importFromYAML"
import { MetadataValueCollection, MetadataValueCollectionEnterprise } from "./types"

export const importMetadataValueCollectionFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: MetadataValueCollectionEnterprise | undefined
): MetadataValueCollection | undefined => {
  if (!data || data.length === 0) return undefined

  return data.map((item) => {
    const metadataValue = importMetadataRefFromYAML(context, _rule, item)
    return metadataValue.value as string
  })
}
