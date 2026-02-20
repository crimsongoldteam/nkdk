import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { importMetadataFieldStringFromEnterprise as importMetadataFieldFromEnterprisePath } from "../metadataPath/importFromEnterprise"
import { MetadataField, MetadataFieldEnterprise, MetadataFields, MetadataFieldsEnterprise } from "./types"

export const importMetadataFieldsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataFieldsEnterprise | undefined
): MetadataFields | undefined => {
  if (!data) return undefined

  return data.map((item) => importMetadataFieldFromEnterprise(context, undefined, item)!)
}

export const importMetadataFieldFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataFieldEnterprise | undefined
): MetadataField | undefined => {
  if (!data) return undefined

  return importMetadataFieldFromEnterprisePath(context, undefined, data)
}

registerTypeRule("MetadataField", "importFromEnterprise", importMetadataFieldsFromEnterprise)
