import { ConfigurationContextFromXML } from "../../context/types"
import { importPropertiesFromXML } from "../../orchestration"
import { XML_SOURCE_KEYS } from "../../orchestration/property/helpers"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm, ClientApplicationFormXML, FormMetadataXML, FormRulesTags } from "./types"
import { childUid } from "../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexFormElementRootLogicalAddress,
  withConfigurationIndexXmlNodeLogicalAddress,
} from "../../configurationIndex/collector/context"

export function importClientApplicationFormFromXML(params: {
  context: ConfigurationContextFromXML
  xml: ClientApplicationFormXML
  xmlMetadata: FormMetadataXML
}): ClientApplicationForm {
  const { context, xml, xmlMetadata } = params
  const collection = getConfigurationIndexCollectionContext(context)
  const formBodyContext =
    collection === undefined
      ? context
      : withConfigurationIndexXmlNodeLogicalAddress(
          withConfigurationIndexFormElementRootLogicalAddress(context, collection.logicalAddress),
          childUid(collection.logicalAddress, "ЧастьФормы", "Содержимое")
        )

  const formProperties = importPropertiesFromXML({
    context: formBodyContext,
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
