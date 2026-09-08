import { capitalize } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { ResolvedPropertyStateItemCapability } from "../../ruleRuntime/definition"
import { getOwnPropertyImplicitValueYAML } from "../../ruleRuntime/property/propertyStateSchema"
import type { ImportSourceReader } from "./importSource"

type Property = MetadataItemRule["properties"][string]
interface Entry {
  readonly propertyKey: string
  readonly propertyRule: Property
  readonly capability: ResolvedPropertyStateItemCapability["properties"][string]
  readonly ordinal: number
}
interface Route { readonly children: Map<string, Route>; readonly entries: Entry[] }
interface Plan {
  readonly routes: Route
  readonly own: readonly Entry[]
  readonly fullReferences: readonly Entry[]
  readonly stateKeys: ReadonlyMap<string, string>
}
const emptyItem = {}
const plans = new WeakMap<MetadataItemRule, WeakMap<object, Plan>>()
const xmlProperties = new WeakMap<MetadataItemRule, ReadonlyMap<string, [string, Property]>>()

export function propertyEntriesByXmlName(rule: MetadataItemRule): ReadonlyMap<string, [string, Property]> {
  let entries = xmlProperties.get(rule)
  if (entries !== undefined) return entries
  const prepared = new Map<string, [string, Property]>()
  for (const [key, property] of Object.entries(rule.properties)) {
    const name = property.xml ?? capitalize(key)
    if (!prepared.has(name)) prepared.set(name, [key, property])
  }
  xmlProperties.set(rule, prepared)
  return prepared
}

export function propertyStateImportPlan(rule: MetadataItemRule, item: ResolvedPropertyStateItemCapability | undefined): Plan {
  let variants = plans.get(rule)
  if (variants === undefined) plans.set(rule, variants = new WeakMap())
  const identity = item ?? emptyItem, cached = variants.get(identity)
  if (cached !== undefined) return cached
  const routes: Route = { children: new Map(), entries: [] }, own: Entry[] = [], fullReferences: Entry[] = []
  const stateKeys = new Map([...propertyEntriesByXmlName(rule)].map(([name, [key]]) => [name, key]))
  let ordinal = 0
  for (const [propertyKey, capability] of Object.entries(item?.properties ?? {})) {
    const xmlName = capitalize(propertyKey)
    if (!stateKeys.has(xmlName)) stateKeys.set(xmlName, propertyKey)
    const propertyRule = rule.properties[propertyKey]
    if (typeof propertyRule?.yaml !== "string" || propertyRule.xmlOnly === true) continue
    const entry: Entry = { propertyKey, propertyRule, capability, ordinal: ordinal++ }
    if (propertyRule.metadataTarget !== undefined && Object.hasOwn(propertyRule, "implicitValueYAML")) fullReferences.push(entry)
    if (capability.availability === "own") {
      if (getOwnPropertyImplicitValueYAML(propertyRule) !== undefined) own.push(entry)
      continue
    }
    let route = routes
    const parents = propertyRule.xmlParents ?? []
    const path = rule.itemType === "ClientApplicationForm" && parents[0] === "Form" ? parents.slice(1) : parents
    for (const key of [...path, propertyRule.xml ?? xmlName]) {
      let child = route.children.get(key)
      if (child === undefined) route.children.set(key, child = { children: new Map(), entries: [] })
      route = child
    }
    route.entries.push(entry)
  }
  const plan = { routes, own, fullReferences, stateKeys }
  variants.set(identity, plan)
  return plan
}

export function selectedPropertyStateImports(plan: Plan, reader: ImportSourceReader, source: unknown, borrowed: boolean) {
  const selected = new Map<Entry, unknown>(plan.own.map(entry => [entry, undefined]))
  if (!borrowed) for (const entry of plan.fullReferences) selected.set(entry, undefined)
  if (borrowed) {
    const pending = [{ route: plan.routes, source }]
    while (pending.length !== 0) {
      const current = pending.pop()!
      if (current.route.children.size === 0) continue
      for (const [name, value] of reader.entries(current.source)) {
        const route = current.route.children.get(name)
        if (route === undefined) continue
        for (const entry of route.entries) selected.set(entry, value)
        if (route.children.size !== 0) pending.push({ route, source: value })
      }
    }
  }
  return [...selected].sort(([left], [right]) => left.ordinal - right.ordinal)
}
