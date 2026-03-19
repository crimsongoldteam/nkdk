import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importPropertiesFromYAML, registerTypeRule } from "~/metadata/orchestration"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { getDefaults } from "./defaults"
import { MetadataTabularSectionRules } from "./rules"
import {
  MetadataTabularSection,
  MetadataTabularSectionYAML,
  MetadataTabularSections,
  MetadataTabularSectionsYAML,
} from "./types"

export const importMetadataTabularSectionFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSectionYAML | undefined,
  name: string
): MetadataTabularSection | undefined => {
  if (!data) return undefined

  const result = importPropertiesFromYAML({
    context,
    yaml: data,
    metadataRule: MetadataTabularSectionRules,
    name,
  }) as MetadataTabularSection

  result.name = name
  if (result.synonym === undefined) {
    result.synonym = addDefaultLanguageNameToSynonym(context, undefined, name)
  }

  const defaults = getDefaults(context, result)
  return removeDefaults(result, defaults)
}

export const importMetadataTabularSectionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSectionsYAML | undefined
): MetadataTabularSections | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataTabularSectionFromYAML(context, undefined, value, name))
    .filter((item): item is MetadataTabularSection => item !== undefined)
}

registerTypeRule("MetadataTabularSections", "importFromYAML", importMetadataTabularSectionsFromYAML)
