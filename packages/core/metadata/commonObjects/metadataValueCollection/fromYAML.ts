import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { importMetadataValueFromYAML } from "../metadataValue/fromYAML"
import { MetadataRefValue } from "../metadataValue/types"
import { MetadataValueCollection, MetadataValueCollectionYAML } from "./types"

export const importMetadataValueCollectionFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValueCollectionYAML | undefined
): MetadataValueCollection | undefined => {
  if (!data || data.length === 0) return undefined

  return data.map((item) => {
    const metadataValue = importMetadataValueFromYAML(context, undefined, item) as MetadataRefValue
    return metadataValue.value
  })
}

registerTypeRule("MetadataValueCollection", "importFromYAML", importMetadataValueCollectionFromYAML)
