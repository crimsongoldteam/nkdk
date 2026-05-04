import { applyGraphOps } from "./buildGraph/internal/applyGraphOps"
import { getKindByYaml } from "./buildGraph/internal/edgeKinds"
import { GraphBuilder } from "./buildGraph/internal/GraphBuilder"
import { getTypeRule } from "./formElement/factory"
import { findSubmap, computeValuePosition } from "./property/position"
import { PropertyRule } from "./property/types"
import { MetadataItemRule } from "./property/types"
import { GraphOps } from "./property/fn"

export interface ApplyBuildGraphResultContext {
  graph: GraphBuilder
  parentNodeId: string
  filePath: string
  /** Тип свойства — для понятного сообщения об ошибке. */
  propType: string
  /** Контекст, пробрасываемый в recurse-задачи по умолчанию. */
  extra?: Record<string, unknown>
}

/**
 * Нормализует результат BuildGraphFromModelFunction (GraphOps | GraphOps[] | undefined | void)
 * к массиву секций, применяет каждую через applyGraphOps и разворачивает recurse-задачи
 * через рекурсивный вызов buildGraphFromModel.
 */
export function applyBuildGraphResult(
  result: GraphOps | GraphOps[] | undefined | void,
  ctx: ApplyBuildGraphResultContext,
): void {
  const sections = Array.isArray(result) ? result : result ? [result] : []
  for (const section of sections) {
    const hasOps =
      section.children?.length ||
      section.references?.length ||
      section.formLocalReferences?.length
    if (hasOps) {
      if (!section.edgeKind || !section.edgeYaml) {
        throw new Error(
          `applyBuildGraphResult: обработчик типа "${ctx.propType}" вернул GraphOps без edgeKind/edgeYaml. ` +
            `Чистые функции должны указывать оба поля в результате.`,
        )
      }
      applyGraphOps(section, {
        graph: ctx.graph,
        parentNodeId: ctx.parentNodeId,
        filePath: ctx.filePath,
        edgeKind: section.edgeKind,
        edgeYaml: section.edgeYaml,
      })
    }
    for (const recurse of section.recurse ?? []) {
      buildGraphFromModel({
        model: recurse.model,
        yamlMap: recurse.yamlMap,
        rule: recurse.rule,
        graph: ctx.graph,
        parentNodeId: recurse.parentNodeId,
        filePath: ctx.filePath,
        extra: recurse.extra ?? ctx.extra,
      })
    }
  }
}

/**
 * Обходит модель параллельно с YAML AST, вызывает зарегистрированную extractGraph
 * для свойств с зарегистрированным экстрактором и применяет результат через applyGraphOps.
 * Для коллекций с объявлением buildGraphFromModel или graphChild создаёт дочерние узлы и рекурсирует.
 */
export function buildGraphFromModel(params: {
  model: Record<string, unknown>
  yamlMap: ReturnType<typeof findSubmap>
  rule: MetadataItemRule
  graph: GraphBuilder
  parentNodeId: string
  filePath: string
  /** Дополнительный контекст, пробрасываемый в кастомные buildGraphFromModel-обработчики. */
  extra?: Record<string, unknown>
}): void {
  const { model, yamlMap, rule, graph, parentNodeId, filePath, extra } = params

  for (const [key, propRule] of Object.entries(rule.properties) as [string, PropertyRule][]) {
    const propType = propRule.type
    if (!propType) continue

    const buildGraphFn = getTypeRule(propType, "buildGraphFromModel")
    const graphChildDef = getTypeRule(propType, "graphChild")
    if (graphChildDef) {
      graph.addFlattenSkipKeys(parentNodeId, [key])
    }

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
    if (buildGraphFn) {
      const result = buildGraphFn({
        model: model[key],
        parentNodeId,
        filePath,
        yamlMap,
        propRule,
        extra,
      })
      applyBuildGraphResult(result, { graph, parentNodeId, filePath, propType, extra })
      continue
    }

    // --- graphChild: коллекции с декларативным созданием дочерних узлов ---
    if (!graphChildDef) continue

    const modelValue = model[key]
    if (!Array.isArray(modelValue) || modelValue.length === 0) continue

    const yamlKey = propRule.yaml
    const collectionYamlMap = yamlKey && yamlMap ? findSubmap(yamlMap, yamlKey) : undefined

    for (const [index, item] of (modelValue as Array<Record<string, unknown>>).entries()) {
      const idSuffix = item[graphChildDef.idFrom] as string | undefined
      if (!idSuffix) continue

      const childNodeId = graphChildDef.nodeSegment
        ? `${parentNodeId}.${graphChildDef.nodeSegment}.${idSuffix}`
        : `${parentNodeId}.${idSuffix}`
      const itemYamlMap = collectionYamlMap ? findSubmap(collectionYamlMap, idSuffix) : undefined

      graph.ensureNode(childNodeId, { name: idSuffix })
      graph.addFilePath(childNodeId, filePath)
      graph.setItem(childNodeId, item)
      graph.ensureEdge(parentNodeId, childNodeId, graphChildDef.edgeKind, {
        yaml: graphChildDef.edgeYaml,
        index,
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
