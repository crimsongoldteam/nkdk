import { isMap, isPair, isScalar, YAMLMap } from "yaml"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importPropertiesFromYAML, registerTypeRule } from "~/metadata/orchestration"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { getOrCreateRawNodeId, graph } from "~/metadata/relations/graph"
import { getDefaults } from "./defaults"
import { MetadataTabularSectionRules } from "./rules"
import {
  MetadataTabularSection,
  MetadataTabularSectionYAML,
  MetadataTabularSections,
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

  const { graphContext } = context
  const sectionsYamlMap = graphContext
    ? findSubmap(graphContext.currentYamlMap, _rule?.yaml)
    : undefined

  return Object.entries(data)
    .map(([name, value]) => {
      if (graphContext?.parentNodeId) {
        const sectionNodeId = `${graphContext.parentNodeId}.${EDGE_NAME}.${name}`
        const offset = sectionsYamlMap ? findKeyOffset(sectionsYamlMap, name) : undefined
        const sectionValueYamlMap = findSubmap(sectionsYamlMap, name)

        getOrCreateRawNodeId(sectionNodeId, {
          name,
          positionFrom: offset !== undefined ? { offset } : undefined,
          filePath: graphContext.filePath,
        })
        const edgeKey = `${graphContext.parentNodeId}:${EDGE_NAME}:${sectionNodeId}`
        if (!graph.hasEdge(edgeKey)) {
          graph.addEdgeWithKey(edgeKey, graphContext.parentNodeId, sectionNodeId, {
            yaml: EDGE_NAME,
            name: EDGE_NAME,
          })
        }

        const childContext: ConfigurationContext = {
          ...context,
          graphContext: { ...graphContext, parentNodeId: sectionNodeId, currentYamlMap: sectionValueYamlMap },
        }

        const section = importMetadataTabularSectionFromYAML(childContext, undefined, value, name)
        graph.setNodeAttribute(sectionNodeId, "item", section)

        return section
      }

      return importMetadataTabularSectionFromYAML(context, undefined, value, name)
    })
    .filter((item): item is MetadataTabularSection => item !== undefined)
}

registerTypeRule("MetadataTabularSections", "importFromYAML", importMetadataTabularSectionsFromYAML)
