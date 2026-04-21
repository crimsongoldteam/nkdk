import { isMap, isPair, isScalar, YAMLMap } from "yaml"
import { applyGraphOps } from "../relations/applyGraphOps"
import { MetadataGraph } from "../relations/MetadataGraph"
import { getTypeRule } from "./formElement/factory"
import { PropertyRule } from "./property/types"
import { MetadataItemRule } from "./property/types"

/**
 * Находит позицию значения (не ключа) для заданного ключа в YAMLMap.
 */
function findValuePosition(yamlMap: YAMLMap, key: string): { offset: number } | undefined {
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && (i.key as any).value === key)
  if (!pair || !isPair(pair)) return undefined
  const value = (pair as any).value
  if (!value || typeof value !== "object") return undefined
  const range = (value as any).range
  if (!Array.isArray(range) || range.length === 0) return undefined
  return { offset: range[0] }
}

/**
 * Находит вложенный YAMLMap для заданного ключа.
 */
function findSubmap(yamlMap: YAMLMap | undefined, key: string | undefined): YAMLMap | undefined {
  if (!yamlMap || !key) return undefined
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && (i.key as any).value === key)
  if (!pair || !isPair(pair) || !isMap(pair.value)) return undefined
  return pair.value
}

/**
 * Находит позицию ключа (не значения) для заданного ключа в YAMLMap.
 */
function findKeyOffset(yamlMap: YAMLMap, key: string): number | undefined {
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && (i.key as any).value === key)
  if (!pair || !isPair(pair) || !isScalar(pair.key)) return undefined
  return (pair.key as any).range?.[0]
}

/**
 * Обходит модель параллельно с YAML AST, вызывает зарегистрированную extractGraph
 * для свойств с зарегистрированным экстрактором и применяет результат через applyGraphOps.
 * Для коллекций с объявлением graphChild создаёт дочерние узлы и рекурсирует.
 */
export function buildGraphFromModel(params: {
  model: Record<string, unknown>
  yamlMap: YAMLMap | undefined
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
        const position = yamlKey && yamlMap ? findValuePosition(yamlMap, yamlKey) : undefined
        const ops = extractGraphFn(modelValue, position)
        if (ops) {
          applyGraphOps(ops, { graph, parentNodeId, filePath, edgeName: edgeDef.name })
        }
      }
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
        name: graphChildDef.edgeName,
        kind: graphChildDef.edgeKind,
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
