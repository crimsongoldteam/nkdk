import { yamlScalarTagAt } from "@nkdk/runtime"
import type { TableContext } from "../../validation/dataPath/resolver"
import type { YamlPath } from "../../validation/yamlLocations"

export interface ConditionalOperandOccurrence {
  readonly side: "left" | "right"
  readonly value: unknown
  readonly yamlPath: YamlPath
  readonly comparisonPath: YamlPath
  readonly parent: Record<string, unknown>
  readonly key: "ЛевоеЗначение" | "ПравоеЗначение"
  readonly tagged: boolean
  readonly tableContext?: TableContext
}

export interface ConditionalTargetOccurrence {
  readonly value: string
  readonly yamlPath: YamlPath
  readonly parent: Record<string, unknown> | unknown[]
  readonly key: string | number
  readonly tagged: boolean
}

export interface ConditionalAppearanceOccurrences {
  readonly operands: readonly ConditionalOperandOccurrence[]
  readonly targets: readonly ConditionalTargetOccurrence[]
}

export function collectConditionalAppearanceOccurrences(yaml: unknown): ConditionalAppearanceOccurrences {
  const operands: ConditionalOperandOccurrence[] = []
  const targets: ConditionalTargetOccurrence[] = []
  if (!isRecord(yaml)) return { operands, targets }

  visitConditionalAppearance({
    value: yaml["УсловноеОформлениеРеквизитов"],
    yamlPath: ["УсловноеОформлениеРеквизитов"],
    operands,
    targets,
  })

  const attributes = yaml["Реквизиты"]
  if (isRecord(attributes)) {
    for (const [attributeName, attribute] of Object.entries(attributes)) {
      if (!isRecord(attribute) || !isRecord(attribute["ДинамическийСписок"])) continue
      const dynamicList = attribute["ДинамическийСписок"]
      visitConditionalAppearance({
        value: dynamicList["УсловноеОформление"],
        yamlPath: ["Реквизиты", attributeName, "ДинамическийСписок", "УсловноеОформление"],
        tableContext: { dataPath: attributeName },
        operands,
        targets,
      })
    }
  }

  return { operands, targets }
}

interface ConditionalTraversalParams {
  value: unknown
  yamlPath: YamlPath
  tableContext?: TableContext
  operands: ConditionalOperandOccurrence[]
}

function visitConditionalAppearance(params: ConditionalTraversalParams & {
  targets: ConditionalTargetOccurrence[]
}): void {
  const items = conditionalItems(params.value)
  if (items === undefined) return

  items.forEach((item, index) => {
    if (!isRecord(item)) return
    const itemPath = [...params.yamlPath, "Элементы", index]
    visitTargets(item["Поля"], [...itemPath, "Поля"], params.targets)
    visitFilter({
      value: item["Отбор"],
      yamlPath: [...itemPath, "Отбор"],
      ...(params.tableContext === undefined ? {} : { tableContext: params.tableContext }),
      operands: params.operands,
    })
  })
}

function visitTargets(value: unknown, yamlPath: YamlPath, targets: ConditionalTargetOccurrence[]): void {
  if (!Array.isArray(value)) return
  value.forEach((item, index) => {
    if (typeof item === "string") {
      targets.push({
        value: item,
        yamlPath: [...yamlPath, index],
        parent: value,
        key: index,
        tagged: yamlScalarTagAt(value, index) === "xml/reference",
      })
      return
    }
    if (!isRecord(item) || typeof item["Поле"] !== "string") return
    targets.push({
      value: item["Поле"],
      yamlPath: [...yamlPath, index, "Поле"],
      parent: item,
      key: "Поле",
      tagged: yamlScalarTagAt(item, "Поле") === "xml/reference",
    })
  })
}

function visitFilter(params: ConditionalTraversalParams): void {
  const items = conditionalItems(params.value)
  if (items === undefined) return

  items.forEach((item, index) => {
    if (!isRecord(item)) return
    const comparisonPath = [...params.yamlPath, "Элементы", index]
    if (Object.prototype.hasOwnProperty.call(item, "ТипГруппы")) {
      visitFilter({
        value: { Элементы: item["Элементы"] },
        yamlPath: comparisonPath,
        ...(params.tableContext === undefined ? {} : { tableContext: params.tableContext }),
        operands: params.operands,
      })
      return
    }
    collectOperand(item, "ЛевоеЗначение", "left", comparisonPath, params)
    collectOperand(item, "ПравоеЗначение", "right", comparisonPath, params)
  })
}

function collectOperand(
  item: Record<string, unknown>,
  key: "ЛевоеЗначение" | "ПравоеЗначение",
  side: "left" | "right",
  comparisonPath: YamlPath,
  params: { tableContext?: TableContext; operands: ConditionalOperandOccurrence[] },
): void {
  if (!Object.prototype.hasOwnProperty.call(item, key)) return
  params.operands.push({
    side,
    value: item[key],
    yamlPath: [...comparisonPath, key],
    comparisonPath,
    parent: item,
    key,
    tagged: yamlScalarTagAt(item, key) === "xml/value",
    ...(params.tableContext === undefined ? {} : { tableContext: params.tableContext }),
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function conditionalItems(value: unknown): unknown[] | undefined {
  if (!isRecord(value)) return undefined
  return Array.isArray(value["Элементы"]) ? value["Элементы"] : undefined
}
