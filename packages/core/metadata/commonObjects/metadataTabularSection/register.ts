import { isMap, isPair, isScalar, YAMLMap } from "yaml"
import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { defaultGraph } from "~/metadata/relations/graph"
import { MetadataTabularSectionRules } from "./rules"
import {
  MetadataTabularSection,
  MetadataTabularSectionYAML,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionsYAML,
} from "./types"

const EDGE_NAME = "ТабличнаяЧасть"

function findSubmap(yamlMap: YAMLMap | undefined, key: string | undefined): YAMLMap | undefined {
  if (!yamlMap || !key) return undefined
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === key)
  if (!pair || !isPair(pair) || !isMap(pair.value)) return undefined
  return pair.value
}

function findKeyOffset(yamlMap: YAMLMap, key: string): number | undefined {
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === key)
  if (!pair || !isPair(pair) || !isScalar(pair.key)) return undefined
  return pair.key.range?.[0]
}

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

  const { graphContext } = context
  const g = context.graph ?? defaultGraph
  const sectionsYamlMap = graphContext
    ? findSubmap(graphContext.currentYamlMap, _rule?.yaml)
    : undefined

  return Object.entries(data)
    .map(([name, value]) => {
      if (graphContext?.parentNodeId) {
        const sectionNodeId = `${graphContext.parentNodeId}.${name}`
        const offset = sectionsYamlMap ? findKeyOffset(sectionsYamlMap, name) : undefined
        const sectionValueYamlMap = findSubmap(sectionsYamlMap, name)

        g.ensureNode(sectionNodeId, {
          name,
          positionFrom: offset !== undefined ? { offset } : undefined,
          filePath: graphContext.filePath,
        })
        const edgeKey = `${graphContext.parentNodeId}:${EDGE_NAME}:${sectionNodeId}`
        g.ensureEdge(edgeKey, graphContext.parentNodeId, sectionNodeId, {
          yaml: EDGE_NAME,
          name: EDGE_NAME,
          kind: "composition",
        })

        const childContext: ConfigurationContext = {
          ...context,
          graphContext: { ...graphContext, parentNodeId: sectionNodeId, currentYamlMap: sectionValueYamlMap },
        }

        const section = importMetadataTabularSectionFromYAML(childContext, value, name)
        g.setNodeAttribute(sectionNodeId, "item", section)

        return section
      }

      return importMetadataTabularSectionFromYAML(context, value, name)
    })
    .filter((item): item is MetadataTabularSection => item !== undefined)
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataTabularSections",
  itemRule: MetadataTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  fromYAML: importMetadataTabularSectionsFromYAML,
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

