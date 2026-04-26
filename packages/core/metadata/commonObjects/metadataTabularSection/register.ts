import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { MetadataDocumentTabularSectionRules, MetadataTabularSectionRules } from "./rules"
import {
  MetadataTabularSection,
  MetadataTabularSectionYAML,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionsYAML,
} from "./types"

const importMetadataTabularSectionFromYAML = (
  context: ConfigurationContext,
  yaml: MetadataTabularSectionYAML | undefined,
  name: string
): MetadataTabularSection | undefined => {
  if (!yaml) return undefined

  const properties = importMetadataItemFromYAML({
    context,
    yaml: yaml as MetadataTabularSectionYAML,
    rule: MetadataTabularSectionRules,
    name,
  })

  if (properties == undefined) throw new Error("Properties are required")

  return {
    ...properties,
    name,
  }
}

const importMetadataTabularSectionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSectionsYAML | undefined
): MetadataTabularSections | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataTabularSectionFromYAML(context, value, name))
    .filter((item): item is MetadataTabularSection => item !== undefined)
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataTabularSections",
  itemRule: MetadataTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  fromYAML: importMetadataTabularSectionsFromYAML,
  graphChild: { idFrom: "name", edgeName: "ТабличнаяЧасть", nodeSegment: "ТабличнаяЧасть" },
})

const importMetadataDocumentTabularSectionFromYAML = (
  context: ConfigurationContext,
  yaml: MetadataTabularSectionYAML | undefined,
  name: string
): MetadataTabularSection | undefined => {
  if (!yaml) return undefined

  const properties = importMetadataItemFromYAML({
    context,
    yaml: yaml as MetadataTabularSectionYAML,
    rule: MetadataDocumentTabularSectionRules,
    name,
  })

  if (properties == undefined) throw new Error("Properties are required")

  return {
    ...properties,
    name,
  }
}

const importMetadataDocumentTabularSectionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSectionsYAML | undefined
): MetadataTabularSections | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataDocumentTabularSectionFromYAML(context, value, name))
    .filter((item): item is MetadataTabularSection => item !== undefined)
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataDocumentTabularSections",
  itemRule: MetadataDocumentTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  fromYAML: importMetadataDocumentTabularSectionsFromYAML,
  graphChild: { idFrom: "name", edgeName: "ТабличнаяЧасть", nodeSegment: "ТабличнаяЧасть" },
})

// Compat exports for consumers that call these functions directly
export const importMetadataTabularSectionsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataTabularSectionsXML | undefined
): MetadataTabularSections | undefined => {
  return importPropertyFromXML({ context, rule: { type: "MetadataTabularSections" }, value: xml }) as
    | MetadataTabularSections
    | undefined
}

export const exportMetadataTabularSectionsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataTabularSectionRules,
    keyField: "name",
  }) as MetadataTabularSectionsYAML | undefined
}

export const exportMetadataTabularSectionToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSection | undefined
): MetadataTabularSectionYAML | undefined => {
  if (!data) return undefined
  const result = exportMetadataTabularSectionsToYAML(context, _rule, [data])
  if (!result) return undefined
  return result[data.name] as MetadataTabularSectionYAML | undefined
}
