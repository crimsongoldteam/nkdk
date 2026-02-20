import { MetadataCatalog, MetadataCatalogYAML } from "~/metadata/appliedObjects/metadataCatalog/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importPropertiesFromYAML } from "~/metadata/metadataFactory"
import { MetadataCatalogRules } from "./rules"

export const importMetadataCatalogFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: MetadataCatalogYAML | undefined,
  name: string
): MetadataCatalog | undefined => {
  if (!data) return undefined

  const result = importPropertiesFromYAML({
    context,
    metadataType: "MetadataCatalog",
    yaml: data,
    rules: MetadataCatalogRules,
    name,
  })

  return {
    ...result,
    itemType: "MetadataCatalog",
    name,
  }
}
