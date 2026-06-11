/**
 * Регистрирует обработчики buildGraphFromModel для коллекций элементов формы
 * и синглетов (ContextMenu, AutoCommandBar, ExtendedTooltip, ...).
 *
 * PRD #117: элементы формы становятся плоскими узлами графа с NodeId
 * «<formNodeId>.<имяЭлемента>». Owning-рёбра ЭлементФормы идут от ближайшего
 * контейнера к ребёнку. Синглеты висят плоско под формой, ребро от формы.
 */

import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { getElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
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
import { SingleViewStatusAdditionRules } from "./viewStatusAddition/rules"
import { getViewStatusAdditionName } from "./viewStatusAddition/helper"

const FORM_ELEMENT_EDGE_KIND = "FORM_ELEMENT"
const FORM_ELEMENT_EDGE_YAML = "ЭлементФормы"

// ---------------------------------------------------------------------------
// Вспомогательные функции
// ---------------------------------------------------------------------------

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
 * NodeId = `formNodeId.Элемент.helperName(parentName)`.
 * Owning-ребро ЭлементФормы идёт от корня формы (edgeFrom: formNodeId),
 * а не от визуального родителя. Возвращает GraphOps[] с children и recurse.
 */
function buildSingletonResult(params: {
  model: unknown
  parentNodeId: string
  formNodeId: string
  getName: (parentName: string) => string
  singletonRule?: MetadataItemRule
}): GraphOps[] | undefined {
  const { model, parentNodeId, formNodeId, getName, singletonRule } = params

  if (!model || typeof model !== "object") return undefined

  const _parts = parentNodeId.split(".")
  const parentName = _parts[_parts.length - 1] ?? ""
  const singletonName = getName(parentName)
  const singletonNodeId = `${formNodeId}.Элемент.${singletonName}`

  const children: GraphOpsChild[] = [{
    idSuffix: singletonName,
    name: singletonName,
    item: model as Record<string, unknown>,
    absoluteId: singletonNodeId,
    edgeFrom: formNodeId,
  }]

  const recurses: GraphOpsRecurse[] = []
  if (singletonRule) {
    recurses.push({
      model: model as Record<string, unknown>,
      rule: singletonRule,
      parentNodeId: singletonNodeId,
      extra: { formNodeId },
    })
  }

  return [{
    children,
    recurse: recurses,
    edgeKind: FORM_ELEMENT_EDGE_KIND,
    edgeYaml: FORM_ELEMENT_EDGE_YAML,
  }]
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
    const { model, parentNodeId, extra } = handlerParams
    const formNodeId = (extra?.formNodeId as string | undefined) ?? parentNodeId
    return buildSingletonResult({ model, parentNodeId, formNodeId, getName, singletonRule })
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
  propertyType: "SingleViewStatusAddition",
  getName: (name) => getViewStatusAdditionName({ name }),
  singletonRule: SingleViewStatusAdditionRules as unknown as MetadataItemRule,
})
