import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldStringToYAML as exportMetadataFieldToYAMLPath } from "../metadataPath/toYAML"
import { MetadataField, MetadataFieldYAML, MetadataFields, MetadataFieldsYAML } from "./types"

export const exportMetadataFieldsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataFields | undefined
): MetadataFieldsYAML | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataFieldToYAML(context, undefined, item)!)
}

export const exportMetadataFieldToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataField | undefined
): MetadataFieldYAML | undefined => {
  if (!data) return undefined

  return exportMetadataFieldToYAMLPath(context, undefined, data)
}

registerTypeRule("MetadataField", "exportToYAML", exportMetadataFieldsToYAML)
