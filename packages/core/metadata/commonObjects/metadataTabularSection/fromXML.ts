import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importPropertiesFromXML, registerTypeRule } from "~/metadata/orchestration"
import { MetadataTabularSectionRules } from "./rules"
import {
  MetadataTabularSection,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionXML,
} from "./types"

export const importMetadataTabularSectionsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataTabularSectionsXML | MetadataTabularSectionXML | undefined
): MetadataTabularSections | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map(
    (value: MetadataTabularSectionXML) => importMetadataTabularSectionFromXML(context, undefined, value)!
  )
}

const importMetadataTabularSectionFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataTabularSectionXML
): MetadataTabularSection => {
  const properties = importPropertiesFromXML({
    context,
    xml,
    rule: MetadataTabularSectionRules,
  })

  const result: MetadataTabularSection = {
    itemType: "MetadataTabularSection",
    ...properties,
  } as MetadataTabularSection

  return result
}

registerTypeRule("MetadataTabularSections", "importFromXML", importMetadataTabularSectionsFromXML)
