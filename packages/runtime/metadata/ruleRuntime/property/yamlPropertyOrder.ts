import type { MetadataItemRule } from "./types"
import { arrangeProperties } from "../../../helpers/arrangeProperties"
import type { XmlAnomalyAnnotations } from "../../../yaml/xmlAnomalyAnnotations"

const collator = new Intl.Collator("ru")
const ruleOrders = new WeakMap<MetadataItemRule, readonly string[]>()
const orderKeys = new WeakMap<readonly string[], ReadonlySet<string>>()

const priority = (key: string): number => {
  if (key === "Заголовок" || key === "Синоним") return 0
  if (key === "Вид") return 1
  if (key === "Тип") return 2
  return 3
}

const compareKeys = (left: string, right: string): number =>
  priority(left) - priority(right) || collator.compare(left, right)

export function compileYamlPropertyOrder(keys: readonly string[]): readonly string[] {
  const unique = new Set(keys)
  const ordered = Object.freeze([...unique].sort(compareKeys))
  orderKeys.set(ordered, unique)
  return ordered
}

export function getYamlRulePropertyOrder(rule: MetadataItemRule): readonly string[] {
  const cached = ruleOrders.get(rule)
  if (cached !== undefined) return cached
  const order = compileYamlPropertyOrder(Object.values(rule.properties).flatMap(
    property => property.yaml === undefined ? [] : [property.yaml],
  ))
  ruleOrders.set(rule, order)
  return order
}

export function orderYamlRuleProperties(
  value: Record<string, unknown>,
  order: readonly string[],
  annotations?: XmlAnomalyAnnotations,
): Record<string, unknown> {
  const originalKeys = Object.keys(value)
  let known = orderKeys.get(order)
  if (known === undefined) {
    known = new Set(order)
    orderKeys.set(order, known)
  }
  const additional = originalKeys.filter(key => !known.has(key))
  if (additional.length > 1) additional.sort((left, right) => {
    const leftAnnotation = annotations?.keyAt(value, left)
    const rightAnnotation = annotations?.keyAt(value, right)
    const byKey = compareKeys(leftAnnotation?.logicalKey ?? left, rightAnnotation?.logicalKey ?? right)
    if (byKey !== 0) return byKey
    return (leftAnnotation?.occurrence ?? 0) - (rightAnnotation?.occurrence ?? 0)
  })
  const keys: string[] = []
  let additionalIndex = 0
  for (const key of order) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue
    while (additionalIndex < additional.length && compareKeys(additional[additionalIndex]!, key) < 0) {
      keys.push(additional[additionalIndex++]!)
    }
    keys.push(key)
  }
  for (; additionalIndex < additional.length; additionalIndex++) keys.push(additional[additionalIndex]!)
  return arrangeProperties(value, originalKeys, keys)
}

export const sortYamlRuleProperties = (value: Record<string, unknown>): Record<string, unknown> => {
  const originalKeys = Object.keys(value)
  return arrangeProperties(value, originalKeys, [...originalKeys].sort(compareKeys))
}
