import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importPropertiesFromXML, registerTypeRule } from "~/metadata/orchestration"
import { getDefaults } from "./defaults"
import { MetadataTabularSectionRules } from "./rules"
import {
  MetadataTabularSection,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionXML,
} from "./types"
import { ConfigurationContextFromXML } from "~/metadata/context/types"

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

  const defaults = getDefaults(context, result)
  const cleaned = removeDefaults(result, defaults)
  if (Array.isArray(cleaned.attributes) && cleaned.attributes.length === 0) {
    const { attributes: _a, ...rest } = cleaned
    return rest as MetadataTabularSection
  }
  return cleaned
}

registerTypeRule("MetadataTabularSections", "importFromXML", importMetadataTabularSectionsFromXML)
