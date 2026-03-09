import { ConfigurationContext } from "~/metadata/context/types"
import { ElementXML, importPropertiesFromXML } from "~/metadata/orchestration"
import { importEventsFromXML } from "~/metadata/orchestration/event"
import { ClientApplicationFormRules } from "./rules"
import {
  ClientApplicationForm,
  ClientApplicationFormReference,
  ClientApplicationFormXML,
  FormMetadataXML,
  FormRulesTags,
} from "./types"

export function importClientApplicationFormFromXML(params: {
  context: ConfigurationContext
  xml: ClientApplicationFormXML
  xmlMetadata: FormMetadataXML
}): ClientApplicationForm

export function importClientApplicationFormFromXML(params: {
  context: ConfigurationContext
  xml: ClientApplicationFormXML
  xmlMetadata: FormMetadataXML
  forReference: true
}): ClientApplicationFormReference
export function importClientApplicationFormFromXML(params: {
  context: ConfigurationContext
  xml: ClientApplicationFormXML
  xmlMetadata: FormMetadataXML
  forReference?: true
}): ClientApplicationFormReference | ClientApplicationForm {
  const { context, xml, xmlMetadata } = params
  const forReference = params.forReference ?? false

  const formProperties = importPropertiesFromXML({
    context,
    xml: xml,
    rule: ClientApplicationFormRules,
    tags: [FormRulesTags.Form],
    ...(forReference ? { forReference: true as const } : {}),
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
