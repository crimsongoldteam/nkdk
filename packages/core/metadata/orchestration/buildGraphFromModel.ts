import { applyGraphOps } from "../relations/applyGraphOps"
import { getKindByYaml } from "../relations/edgeKinds"
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
  /** Дополнительный контекст, пробрасываемый в кастомные buildGraphFromModel-обработчики. */
  extra?: Record<string, unknown>
}): void {
  const { model, yamlMap, rule, graph, parentNodeId, filePath, extra } = params

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
          // yaml = propRule.yaml ?? edgeDef.yaml (русский YAML-ключ)
          // kind = propRule.graphEdgeKind ?? edgeDef.kind ?? getKindByYaml(yaml)
          const edgeYaml = propRule.yaml ?? edgeDef.yaml
          const edgeKind =
            propRule.graphEdgeKind ?? edgeDef.kind ?? (edgeYaml ? getKindByYaml(edgeYaml) : undefined)
          if (!edgeKind || !edgeYaml) {
            throw new Error(
              `buildGraphFromModel: не удалось определить kind/yaml ребра для свойства "${key}" (тип: ${propType}). ` +
                `Укажите yaml или graphEdgeKind на свойстве, либо kind/yaml в регистрации graphEdgeFromParent.`,
            )
          }
          applyGraphOps(ops, { graph, parentNodeId, filePath, edgeKind, edgeYaml })
        }
      }
      continue
    }

    // --- buildGraphFromModel: типы с кастомной логикой построения графа ---
    const buildGraphFn = getTypeRule(propType, "buildGraphFromModel")
    if (buildGraphFn) {
      const result = buildGraphFn({
        model: model[key],
        parentNodeId,
        filePath,
        yamlMap,
        propRule,
        graph,
        extra,
      })
      if (result && (result.children?.length || result.references?.length)) {
        if (!result.edgeKind || !result.edgeYaml) {
          throw new Error(
            `buildGraphFromModel: обработчик типа "${propType}" вернул GraphOps без edgeKind/edgeYaml. ` +
              `Чистые функции должны указывать оба поля в результате.`,
          )
        }
        applyGraphOps(result, {
          graph,
          parentNodeId,
          filePath,
          edgeKind: result.edgeKind,
          edgeYaml: result.edgeYaml,
        })
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

      const childNodeId = graphChildDef.nodeSegment
        ? `${parentNodeId}.${graphChildDef.nodeSegment}.${idSuffix}`
        : `${parentNodeId}.${idSuffix}`
      const itemOffset = collectionYamlMap ? findKeyOffset(collectionYamlMap, idSuffix) : undefined
      const itemYamlMap = collectionYamlMap ? findSubmap(collectionYamlMap, idSuffix) : undefined

      graph.promoteNode(childNodeId, {
        name: idSuffix,
        positionFrom: itemOffset !== undefined ? { offset: itemOffset } : undefined,
        filePaths: [filePath],
        item,
      })

      const edgeKey = `${parentNodeId}:${graphChildDef.edgeKind}:${childNodeId}`
      graph.ensureEdge(edgeKey, parentNodeId, childNodeId, {
        yaml: graphChildDef.edgeYaml,
        kind: graphChildDef.edgeKind,
      })

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
