import { applyGraphOps } from "../relations/applyGraphOps"
import { MetadataGraph } from "../relations/MetadataGraph"
import { getTypeRule } from "./formElement/factory"
import { findKeyOffset, findSubmap, computeValuePosition } from "./property/position"
import { PropertyRule } from "./property/types"
import { MetadataItemRule } from "./property/types"

/**
 * Обходит модель параллельно с YAML AST, вызывает зарегистрированную extractGraph
 * для свойств с зарегистрированным экстрактором и применяет результат через applyGraphOps.
 * Для коллекций с объявлением buildGraphFromModel или graphChild создаёт дочерние узлы и рекурсирует.
 */
export function buildGraphFromModel(params: {
  model: Record<string, unknown>
  yamlMap: ReturnType<typeof findSubmap>
  rule: MetadataItemRule
  graph: MetadataGraph
  parentNodeId: string
  filePath: string
}): void {
  const { model, yamlMap, rule, graph, parentNodeId, filePath } = params

  for (const [key, propRule] of Object.entries(rule.properties) as [string, PropertyRule][]) {
    const propType = propRule.type
    if (!propType) continue

    // --- extractGraph: TypeDescription и другие одиночные reference-свойства ---
    const extractGraphFn = getTypeRule(propType, "extractGraph")
    const edgeDef = getTypeRule(propType, "graphEdgeFromParent")

    if (extractGraphFn && edgeDef) {
      const modelValue = model[key]
      if (modelValue !== undefined) {
        const yamlKey = propRule.yaml
        const position = yamlKey && yamlMap ? computeValuePosition(yamlMap, yamlKey) : undefined
        const ops = extractGraphFn(modelValue, position)
        if (ops) {
          applyGraphOps(ops, { graph, parentNodeId, filePath, edgeName: edgeDef.name })
        }
      }
      continue
    }

    // --- buildGraphFromModel: типы с кастомной логикой построения графа ---
    const buildGraphFn = getTypeRule(propType, "buildGraphFromModel")
    if (buildGraphFn) {
      buildGraphFn({ model: model[key], parentNodeId, filePath, yamlMap, propRule, graph })
      continue
    }

    // --- graphChild: коллекции с декларативным созданием дочерних узлов ---
    const graphChildDef = getTypeRule(propType, "graphChild")
    if (!graphChildDef) continue

    const modelValue = model[key]
    if (!Array.isArray(modelValue) || modelValue.length === 0) continue

    const yamlKey = propRule.yaml
    const collectionYamlMap = yamlKey && yamlMap ? findSubmap(yamlMap, yamlKey) : undefined

    for (const item of modelValue as Array<Record<string, unknown>>) {
      const idSuffix = item[graphChildDef.idFrom] as string | undefined
      if (!idSuffix) continue

      const childNodeId = `${parentNodeId}.${idSuffix}`
      const itemOffset = collectionYamlMap ? findKeyOffset(collectionYamlMap, idSuffix) : undefined
      const itemYamlMap = collectionYamlMap ? findSubmap(collectionYamlMap, idSuffix) : undefined

      graph.ensureNode(childNodeId, {
        name: idSuffix,
        positionFrom: itemOffset !== undefined ? { offset: itemOffset } : undefined,
        filePath,
      })

      const edgeKey = `${parentNodeId}:${graphChildDef.edgeName}:${childNodeId}`
      graph.ensureEdge(edgeKey, parentNodeId, childNodeId, {
        yaml: graphChildDef.edgeName,
        kind: graphChildDef.edgeName,
      })

      graph.setNodeAttribute(childNodeId, "item", item)

      buildGraphFromModel({
        model: item,
        yamlMap: itemYamlMap,
        rule: graphChildDef.itemRule,
        graph,
        parentNodeId: childNodeId,
        filePath,
      })
    }
  }
}
