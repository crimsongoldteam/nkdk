import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportPropertiesToYAML, registerTypeRule } from "~/metadata/orchestration"
import { MetadataTabularSectionRules } from "./rules"
import {
  MetadataTabularSection,
  MetadataTabularSectionYAML,
  MetadataTabularSections,
  MetadataTabularSectionsYAML,
} from "./types"

export const exportMetadataTabularSectionToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSection | undefined
): MetadataTabularSectionYAML | undefined => {
  if (!data) return undefined

  return exportPropertiesToYAML({
    context,
    data,
    rule: MetadataTabularSectionRules,
  }) as MetadataTabularSectionYAML | undefined
}

export const exportMetadataTabularSectionsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsYAML | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: MetadataTabularSection) => [
      value.name,
      exportMetadataTabularSectionToYAML(context, undefined, value)!,
    ])
  )
}

registerTypeRule("MetadataTabularSections", "exportToYAML", exportMetadataTabularSectionsToYAML)
