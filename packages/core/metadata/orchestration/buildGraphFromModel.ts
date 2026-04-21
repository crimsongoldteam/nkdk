import { isPair, isScalar, YAMLMap } from "yaml"
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
 * Обходит модель параллельно с YAML AST, вызывает зарегистрированную extractGraph
 * для свойств с зарегистрированным экстрактором и применяет результат через applyGraphOps.
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

    const extractGraphFn = getTypeRule(propType, "extractGraph")
    const edgeDef = getTypeRule(propType, "graphEdgeFromParent")

    if (!extractGraphFn || !edgeDef) continue

    const modelValue = model[key]
    if (modelValue === undefined) continue

    const yamlKey = propRule.yaml
    const position = yamlKey && yamlMap ? findValuePosition(yamlMap, yamlKey) : undefined

    const ops = extractGraphFn(modelValue, position)
    if (!ops) continue

    applyGraphOps(ops, { graph, parentNodeId, filePath, edgeName: edgeDef.name })
  }
}
