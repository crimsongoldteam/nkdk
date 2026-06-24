import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importPropertiesFromXML } from "~/metadata/orchestration"
import { XML_SOURCE_KEYS } from "~/metadata/orchestration/property/helpers"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm, ClientApplicationFormXML, FormMetadataXML, FormRulesTags } from "./types"

export function importClientApplicationFormFromXML(params: {
  context: ConfigurationContextFromXML
  xml: ClientApplicationFormXML
  xmlMetadata: FormMetadataXML
}): ClientApplicationForm {
  const { context, xml, xmlMetadata } = params

  const formProperties = importPropertiesFromXML({
    context,
    xml: xml,
    rule: ClientApplicationFormRules,
    tags: [FormRulesTags.Form],
  })!

  const metadataProperties = importPropertiesFromXML({
    context,
    xml: xmlMetadata,
    rule: ClientApplicationFormRules,
    tags: [FormRulesTags.Metadata],
  })

  const result: ClientApplicationForm = {
    itemType: ClientApplicationFormRules.itemType,
    ...formProperties,
    ...metadataProperties,
    childItems: formProperties.childItems ?? [],
    commands: formProperties.commands ?? [],
  }

  const sourceKeys = {
    ...(formProperties as any)[XML_SOURCE_KEYS],
    ...(metadataProperties as any)?.[XML_SOURCE_KEYS],
  }
  if (Object.keys(sourceKeys).length > 0) {
    Object.defineProperty(result, XML_SOURCE_KEYS, {
      value: sourceKeys,
      enumerable: false,
    })
  }

  return result
}
