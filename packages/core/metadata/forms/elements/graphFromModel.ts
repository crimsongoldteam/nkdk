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
import { applyGraphOps } from "~/metadata/relations/applyGraphOps"
import { getKindByYaml } from "~/metadata/relations/edgeKinds"
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
    const sections = Array.isArray(result) ? result : result ? [result] : []
    for (const section of sections) {
      if (!section.children?.length && !section.references?.length && !section.formLocalReferences?.length) continue
      if (!section.edgeKind || !section.edgeYaml) {
        throw new Error(
          `buildElementChildrenGraph: обработчик типа "${propType}" вернул GraphOps без edgeKind/edgeYaml. ` +
            `Чистые функции должны указывать оба поля в результате.`,
        )
      }
      applyGraphOps(section, {
        graph,
        parentNodeId,
        filePath,
        edgeKind: section.edgeKind,
        edgeYaml: section.edgeYaml,
      })
    }
  }
}

/**
 * Создаёт плоские узлы для массива дочерних элементов формы.
 * NodeId = `formNodeId.elementName`, ребро ЭлементФормы от `parentNodeId`.
 */
function buildChildItemsGraph(params: {
  items: unknown
  parentNodeId: string
  formNodeId: string
  filePath: string
  graph: MetadataGraph
}): void {
  const { items, parentNodeId, formNodeId, filePath, graph } = params

  if (!Array.isArray(items)) return

  for (const element of items) {
    if (!element || typeof element !== "object") continue
    const elem = element as Record<string, unknown>
    const elementName = elem.name as string | undefined
    if (!elementName) continue

    const elementNodeId = `${formNodeId}.Элемент.${elementName}`

    graph.promoteNode(elementNodeId, {
      name: elementName,
      filePaths: [filePath],
      item: elem,
    })

    const edgeKey = `${parentNodeId}:${FORM_ELEMENT_EDGE_KIND}:${elementNodeId}`
    graph.ensureEdge(edgeKey, parentNodeId, elementNodeId, {
      yaml: FORM_ELEMENT_EDGE_YAML,
      kind: FORM_ELEMENT_EDGE_KIND,
    })

    // Рекурсия в свойства элемента (childItems и синглеты)
    const itemType = elem.itemType as string | undefined
    if (itemType) {
      let elementRule: MetadataItemRule | undefined
      try {
        elementRule = getElementRule(itemType as never) as unknown as MetadataItemRule
      } catch {
        // Неизвестный тип элемента — пропускаем
      }
      if (elementRule) {
        buildElementChildrenGraph({
          element: elem,
          elementRule,
          parentNodeId: elementNodeId,
          formNodeId,
          filePath,
          graph,
        })
      }
    }
  }
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
    const { model, parentNodeId, filePath, graph, extra } = params
    const formNodeId = (extra?.formNodeId as string | undefined) ?? parentNodeId
    buildChildItemsGraph({ items: model, parentNodeId, formNodeId, filePath, graph })
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
