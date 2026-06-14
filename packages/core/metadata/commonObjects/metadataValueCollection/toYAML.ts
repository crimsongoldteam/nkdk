import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataObjectStringToYAML } from "../metadataPath/toYAML"
import { MetadataValueCollection, MetadataValueCollectionYAML } from "./types"

export const exportMetadataValueCollectionToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValueCollection | undefined
): MetadataValueCollectionYAML | undefined => {
  if (!data || data.length === 0) return undefined

  return data.map((item) => exportMetadataObjectStringToYAML(context, _rule, item)!)
}

registerTypeRule("MetadataValueCollection", "exportToYAML", exportMetadataValueCollectionToYAML)
