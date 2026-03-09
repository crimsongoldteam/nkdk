import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { ElementXML, importPropertiesFromXML } from "~/metadata/orchestration"
import { importEventsFromXML } from "~/metadata/orchestration/event"
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

  const events = importEventsFromXML(ClientApplicationFormRules, xml as ElementXML)

  const metadataProperties = importPropertiesFromXML({
    context,
    xml: xmlMetadata,
    rule: ClientApplicationFormRules,
    tags: [FormRulesTags.Metadata],
  })

  const result: ClientApplicationForm = {
    itemType: "ClientApplicationForm",
    ...formProperties,
    ...events,
    ...metadataProperties,
    childItems: formProperties.childItems ?? [],
    commands: formProperties.commands ?? [],
  }

  return result
}
