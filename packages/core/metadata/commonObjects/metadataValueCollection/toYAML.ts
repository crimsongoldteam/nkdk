import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { exportMedatataRefToYAML } from "../metadataValue/toYAML"
import { MetadataValueCollection, MetadataValueCollectionYAML } from "./types"

export const exportMetadataValueCollectionToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValueCollection | undefined
): MetadataValueCollectionYAML | undefined => {
  if (!data || data.length === 0) return undefined

  return data.map((item) => exportMedatataRefToYAML(context, item))
}

registerTypeRule("MetadataValueCollection", "exportToYAML", exportMetadataValueCollectionToYAML)
