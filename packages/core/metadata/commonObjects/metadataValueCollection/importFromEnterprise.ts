import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { importMetadataRefFromYAML } from "../metadataValue/fromYAML"
import { MetadataValueCollection, MetadataValueCollectionYAML } from "./types"

export const importMetadataValueCollectionFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataValueCollectionYAML | undefined
): MetadataValueCollection | undefined => {
  if (!data || data.length === 0) return undefined

  return data.map((item) => {
    const metadataValue = importMetadataRefFromYAML(context, undefined, item)
    return metadataValue.value as string
  })
}

registerTypeRule("MetadataValueCollection", "importFromYAML", importMetadataValueCollectionFromYAML)
