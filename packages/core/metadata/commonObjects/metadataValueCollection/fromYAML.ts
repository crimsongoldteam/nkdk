import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { importMetadataObjectStringFromYAML } from "../metadataPath/fromYAML"
import { MetadataValueCollection, MetadataValueCollectionYAML } from "./types"

export const importMetadataValueCollectionFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValueCollectionYAML | undefined
): MetadataValueCollection | undefined => {
  if (!data || data.length === 0) return undefined

  return data.map((item) => importMetadataObjectStringFromYAML(context, _rule, item)!)
}

registerTypeRule("MetadataValueCollection", "importFromYAML", importMetadataValueCollectionFromYAML)
