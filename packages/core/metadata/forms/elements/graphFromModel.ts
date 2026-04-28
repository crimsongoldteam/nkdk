/**
 * Регистрирует обработчики buildGraphFromModel для коллекций элементов формы
 * и синглетов (ContextMenu, AutoCommandBar, ExtendedTooltip, ...).
 *
 * PRD #117: элементы формы становятся плоскими узлами графа с NodeId
 * «<formNodeId>.<имяЭлемента>». Owning-рёбра ЭлементФормы идут от ближайшего
 * контейнера к ребёнку. Синглеты висят плоско под формой, ребро от формы.
 *
 * Срез #118: buildElementChildrenGraph дополнен обработкой extractGraph-хендлеров
 * (TypeDescription и подобных reference-свойств на элементах) + DataPath-рёбра.
 */

import { getTypeRule, registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { getElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { applyBuildGraphResult } from "~/metadata/orchestration/buildGraphFromModel"
import { applyGraphOps } from "~/metadata/relations/applyGraphOps"
import { getKindByYaml } from "~/metadata/relations/edgeKinds"
import {
  GraphOps,
  GraphOpsChild,
  GraphOpsRecurse,
} from "~/metadata/orchestration/property/fn"
import { AutoCommandBarRules } from "./autoCommandBar/rules"
import { getAutoCommandBarName } from "./autoCommandBar/helper"
import { ContextMenuRules } from "./contextMenu/rules"
import { getContextMenuName } from "./contextMenu/helper"
import { getExtendedTooltipName } from "./extendedTooltip/helper"
import { SingleSearchControlAdditionRules } from "./searchControlAddition/rules"
import { getSearchControlAdditionName } from "./searchControlAddition/helper"
import { SingleSearchStringAdditionRules } from "./searchStringAddition/rules"
import { getSearchStringAdditionName } from "./searchStringAddition/helper"
import { getViewStatusAdditionName } from "./viewStatusAddition/helper"

const FORM_ELEMENT_EDGE_KIND = "FORM_ELEMENT"
const FORM_ELEMENT_EDGE_YAML = "ЭлементФормы"

// ---------------------------------------------------------------------------
// Вспомогательные функции
// ---------------------------------------------------------------------------

/**
 * Обходит свойства элемента и вызывает только buildGraphFromModel-обработчики
 * (пропускает extractGraph для TypeDescription, DataPath и т.д. — они добавятся
 * в срезах #118, #119).
 *
 * Параметр `parentNodeId` — непосредственный контейнер (источник owning-рёбер).
 * Параметр `formNodeId` — корень формы (для построения плоских NodeId).
 */
function buildElementChildrenGraph(params: {
  element: Record<string, unknown>
  elementRule: MetadataItemRule
  parentNodeId: string
  formNodeId: string
  filePath: string
  graph: MetadataGraph
}): void {
  const { element, elementRule, parentNodeId, formNodeId, filePath, graph } = params

  for (const [key, propRule] of Object.entries(elementRule.properties) as [
    string,
    { type?: string; yaml?: string; graphEdgeKind?: string },
  ][]) {
    const propType = propRule.type as PropertyRuleType | undefined
    if (!propType) continue

    // --- extractGraph: TypeDescription и другие одиночные reference-свойства ---
    const extractGraphFn = getTypeRule(propType, "extractGraph")
    const edgeDef = getTypeRule(propType, "graphEdgeFromParent")
    if (extractGraphFn && edgeDef) {
      const value = element[key]
      if (value !== undefined && value !== null) {
        const ops = extractGraphFn(value)
        if (ops) {
          const edgeYaml = propRule.yaml ?? edgeDef.yaml
          const edgeKind =
            propRule.graphEdgeKind ?? edgeDef.kind ?? (edgeYaml ? getKindByYaml(edgeYaml) : undefined)
          if (edgeKind && edgeYaml) {
            applyGraphOps(ops, { graph, parentNodeId, filePath, edgeKind, edgeYaml })
          }
        }
      }
      continue
    }

    // --- buildGraphFromModel: типы с кастомной логикой построения графа ---
    const buildGraphFn = getTypeRule(propType, "buildGraphFromModel")
    if (!buildGraphFn) continue

    const value = element[key]
    if (value === undefined || value === null) continue

    const result = buildGraphFn({
      model: value,
      parentNodeId,
      filePath,
      yamlMap: undefined,
      propRule: propRule as never,
      graph,
      extra: { formNodeId },
    })
    applyBuildGraphResult(result, {
      graph,
      parentNodeId,
      filePath,
      propType,
      extra: { formNodeId },
    })
  }
}

/**
 * Создаёт плоские узлы для массива дочерних элементов формы.
 * NodeId = `formNodeId.Элемент.elementName`, ребро ЭлементФормы от parentNodeId.
 * Возвращает GraphOps[] с children и recurse — оркестратор сам всё применит.
 */
function buildChildItemsResult(params: {
  items: unknown
  formNodeId: string
}): GraphOps[] | undefined {
  const { items, formNodeId } = params

  if (!Array.isArray(items)) return undefined

  const children: GraphOpsChild[] = []
  const recurses: GraphOpsRecurse[] = []

  for (const element of items) {
    if (!element || typeof element !== "object") continue
    const elem = element as Record<string, unknown>
    const elementName = elem.name as string | undefined
    if (!elementName) continue

    const elementNodeId = `${formNodeId}.Элемент.${elementName}`

    children.push({
      idSuffix: elementName,
      name: elementName,
      item: elem,
      absoluteId: elementNodeId,
    })

    const itemType = elem.itemType as string | undefined
    if (itemType) {
      let elementRule: MetadataItemRule | undefined
      try {
        elementRule = getElementRule(itemType as never) as unknown as MetadataItemRule
      } catch {
        // Неизвестный тип элемента — пропускаем
      }
      if (elementRule) {
        recurses.push({
          model: elem,
          rule: elementRule,
          parentNodeId: elementNodeId,
          extra: { formNodeId },
        })
      }
    }
  }

  if (children.length === 0) return undefined

  return [{
    children,
    recurse: recurses,
    edgeKind: FORM_ELEMENT_EDGE_KIND,
    edgeYaml: FORM_ELEMENT_EDGE_YAML,
  }]
}

/**
 * Создаёт узел-синглет плоско под формой с именем через хелпер.
 * NodeId = `formNodeId.helperName(parentElementName)`.
 * Owning-ребро ЭлементФормы идёт от formNodeId (не от родительского элемента).
 */
function buildSingletonGraph(params: {
  model: unknown
  parentNodeId: string
  formNodeId: string
  filePath: string
  graph: MetadataGraph
  getName: (parentName: string) => string
  singletonRule?: MetadataItemRule
}): void {
  const { model, parentNodeId, formNodeId, filePath, graph, getName, singletonRule } = params

  if (!model || typeof model !== "object") return

  const _parts = parentNodeId.split(".")
  const parentName = _parts[_parts.length - 1] ?? ""
  const singletonName = getName(parentName)
  const singletonNodeId = `${formNodeId}.Элемент.${singletonName}`

  graph.promoteNode(singletonNodeId, {
    name: singletonName,
    filePaths: [filePath],
    item: model,
  })

  // Ребро от ФОРМЫ, а не от визуального родителя
  const edgeKey = `${formNodeId}:${FORM_ELEMENT_EDGE_KIND}:${singletonNodeId}`
  graph.ensureEdge(edgeKey, formNodeId, singletonNodeId, {
    yaml: FORM_ELEMENT_EDGE_YAML,
    kind: FORM_ELEMENT_EDGE_KIND,
  })

  // Рекурсия в собственные дочерние элементы синглета (childItems и вложенные синглеты)
  if (singletonRule) {
    buildElementChildrenGraph({
      element: model as Record<string, unknown>,
      elementRule: singletonRule,
      parentNodeId: singletonNodeId,
      formNodeId,
      filePath,
      graph,
    })
  }
}

// ---------------------------------------------------------------------------
// Регистрация обработчиков для коллекций элементов
// ---------------------------------------------------------------------------

function registerChildItemsHandler(propertyType: PropertyRuleType): void {
  registerTypeRule(propertyType, "buildGraphFromModel", (params) => {
    const { model, parentNodeId, extra } = params
    const formNodeId = (extra?.formNodeId as string | undefined) ?? parentNodeId
    return buildChildItemsResult({ items: model, formNodeId })
  })
}

registerChildItemsHandler("GroupChildItems")
registerChildItemsHandler("TableChildItems")
registerChildItemsHandler("PagesChildItems")
registerChildItemsHandler("CommandBarChildItems")

// ---------------------------------------------------------------------------
// Регистрация обработчиков для синглетов
// ---------------------------------------------------------------------------

function registerSingletonHandler(params: {
  propertyType: PropertyRuleType
  getName: (parentName: string) => string
  singletonRule?: MetadataItemRule
}): void {
  const { propertyType, getName, singletonRule } = params
  registerTypeRule(propertyType, "buildGraphFromModel", (handlerParams) => {
    const { model, parentNodeId, filePath, graph, extra } = handlerParams
    const formNodeId = (extra?.formNodeId as string | undefined) ?? parentNodeId
    buildSingletonGraph({ model, parentNodeId, formNodeId, filePath, graph, getName, singletonRule })
  })
}

registerSingletonHandler({
  propertyType: "ContextMenu",
  getName: (name) => getContextMenuName({ name }),
  singletonRule: ContextMenuRules as unknown as MetadataItemRule,
})

registerSingletonHandler({
  propertyType: "AutoCommandBar",
  getName: (name) => getAutoCommandBarName({ name }),
  singletonRule: AutoCommandBarRules as unknown as MetadataItemRule,
})

registerSingletonHandler({
  propertyType: "TableAutoCommandBar",
  getName: (name) => getAutoCommandBarName({ name }),
  singletonRule: AutoCommandBarRules as unknown as MetadataItemRule,
})

registerSingletonHandler({
  propertyType: "ExtendedTooltip",
  getName: (name) => getExtendedTooltipName({ name }),
  // ExtendedTooltip не имеет childItems — singletonRule не нужен
})

registerSingletonHandler({
  propertyType: "SingleSearchControlAddition",
  getName: (name) => getSearchControlAdditionName({ name }),
  singletonRule: SingleSearchControlAdditionRules as unknown as MetadataItemRule,
})

registerSingletonHandler({
  propertyType: "SingleSearchStringAddition",
  getName: (name) => getSearchStringAdditionName({ name }),
  singletonRule: SingleSearchStringAdditionRules as unknown as MetadataItemRule,
})

registerSingletonHandler({
  propertyType: "ViewStatusAddition",
  getName: (name) => getViewStatusAdditionName({ name }),
  // ViewStatusAddition не имеет childItems
})
