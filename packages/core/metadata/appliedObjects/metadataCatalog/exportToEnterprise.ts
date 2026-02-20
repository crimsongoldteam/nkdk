import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportPropertiesToYAML } from "~/metadata/metadataFactory"
import { MetadataCatalogRules } from "./rules"
import { MetadataCatalog, MetadataCatalogYAML } from "./types"

export const exportMetadataCatalogToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: MetadataCatalog | undefined
): MetadataCatalogYAML | undefined => {
  if (!data) return undefined

  const result = exportPropertiesToYAML({
    context,
    data: data,
    rules: MetadataCatalogRules,
  })

  return result
}
