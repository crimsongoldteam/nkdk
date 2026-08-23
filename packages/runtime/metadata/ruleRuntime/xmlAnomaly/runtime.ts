import type { XmlElementNode } from "../../../xml/import/document"
import { createYAMLPropertySource } from "../property/fromYAMLToXML"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import type {
  XmlAnomalyLocation,
  XmlCompactRawInput,
  XmlCompactRawRegistration,
} from "./contracts"
import type { XmlAnomalyRegistry } from "./registry"

export interface XmlAnomalyRuntime {
  requiresImportant(location: XmlAnomalyLocation): boolean
  allowsHiddenSingletonName(location: XmlAnomalyLocation): boolean
  generateCompactRaw(params: {
    readonly rule: MetadataItemRule
    readonly propertyKey: string
    readonly yaml: unknown
  }): readonly XmlElementNode[] | undefined
}

export interface XmlAnomalyRuntimeDependencies {
  resolvePropertyItemRule?: (
    rule: PropertyRule,
  ) => MetadataItemRule | undefined
}

export function createXmlAnomalyRuntime(
  registry: XmlAnomalyRegistry,
  dependencies: XmlAnomalyRuntimeDependencies = {},
): XmlAnomalyRuntime {
  const proven = new WeakMap<
    XmlCompactRawRegistration,
    Map<string, readonly XmlElementNode[]>
  >()
  const blocked = new WeakSet<XmlCompactRawRegistration>()

  return {
    requiresImportant(location) {
      return registry.resolve(location)?.kind === "important"
    },
    allowsHiddenSingletonName(location) {
      return registry.resolve(location)?.kind === "hiddenSingletonName"
    },
    generateCompactRaw(params) {
      const propertyRule = params.rule.properties[params.propertyKey]
      if (propertyRule === undefined) {
        throw new Error(
          `PropertyRule не найден: ${params.rule.itemType}.${params.propertyKey}`,
        )
      }
      const registration = registry.resolve({
        itemType: params.rule.itemType,
        propertyKey: params.propertyKey,
        propertyType: propertyRule.type,
      })
      if (registration?.kind !== "compactRaw") return undefined
      if (blocked.has(registration)) {
        throw new Error(
          `Генератор compact raw заблокирован: ${params.rule.itemType}.${params.propertyKey}`,
        )
      }

      const inputs = freezeClone(extractInputs({
        declarations: registration.inputs,
        rootRule: params.rule,
        rootYaml: params.yaml,
        resolvePropertyItemRule: dependencies.resolvePropertyItemRule,
      }))
      const cacheKey = structuralKey(inputs)
      const cached = proven.get(registration)?.get(cacheKey)
      if (cached !== undefined) return cached

      try {
        const first = freezeGeneratedNodes(registration.generate(inputs))
        const firstHashes = structuralHashes(first)
        const second = freezeGeneratedNodes(registration.generate(inputs))
        if (firstHashes !== structuralHashes(second)) {
          blocked.add(registration)
          throw new Error(
            `Недетерминированный генератор compact raw: ${params.rule.itemType}.${params.propertyKey}`,
          )
        }
        const registrationCache = proven.get(registration) ?? new Map()
        registrationCache.set(cacheKey, first)
        proven.set(registration, registrationCache)
        return first
      } catch (error) {
        blocked.add(registration)
        throw error
      }
    },
  }
}

function extractInputs(params: {
  readonly declarations: readonly XmlCompactRawInput[]
  readonly rootRule: MetadataItemRule
  readonly rootYaml: unknown
  readonly resolvePropertyItemRule?: (
    rule: PropertyRule,
  ) => MetadataItemRule | undefined
}): Record<string, unknown> {
  return Object.fromEntries(params.declarations.map((input) => [
    input.name,
    extractPropertyPath({
      input,
      rootRule: params.rootRule,
      rootYaml: params.rootYaml,
      resolvePropertyItemRule: params.resolvePropertyItemRule,
    }),
  ]))
}

function extractPropertyPath(params: {
  readonly input: XmlCompactRawInput
  readonly rootRule: MetadataItemRule
  readonly rootYaml: unknown
  readonly resolvePropertyItemRule?: (
    rule: PropertyRule,
  ) => MetadataItemRule | undefined
}): unknown {
  let itemRule = params.rootRule
  let yaml = params.rootYaml
  for (const [index, propertyKey] of params.input.propertyPath.entries()) {
    const propertyRule = itemRule.properties[propertyKey]
    const source = createYAMLPropertySource({ yaml, rule: itemRule })
    if (propertyRule === undefined || !source.has(propertyKey)) {
      throw new Error(
        `Не найден вход compact raw ${params.input.propertyPath.join(".")}`,
      )
    }
    yaml = source.raw(propertyKey)
    if (index === params.input.propertyPath.length - 1) return yaml

    const nestedRule = params.resolvePropertyItemRule?.(propertyRule) ??
      inlineItemRule(propertyRule)
    if (nestedRule === undefined) {
      throw new Error(
        `Не найден PropertyRule path compact raw ${params.input.propertyPath.join(".")}`,
      )
    }
    itemRule = nestedRule
  }
  throw new Error(`Не найден вход compact raw ${params.input.name}`)
}

function inlineItemRule(rule: PropertyRule): MetadataItemRule | undefined {
  const candidate: unknown = rule.itemRule
  if (
    typeof candidate !== "object" ||
    candidate === null ||
    !("itemType" in candidate) ||
    !("properties" in candidate)
  ) return undefined
  return candidate as MetadataItemRule
}

function freezeGeneratedNodes(
  value: readonly XmlElementNode[],
): readonly XmlElementNode[] {
  if (
    !Array.isArray(value) ||
    value.some((node) => (
      typeof node !== "object" ||
      node === null ||
      node.type !== "element" ||
      typeof node.structuralHash !== "bigint"
    ))
  ) {
    throw new Error("Генератор compact raw должен вернуть XML element nodes")
  }
  return freezeClone(value)
}

function structuralHashes(nodes: readonly XmlElementNode[]): string {
  return nodes.map(({ structuralHash }) => structuralHash.toString(16)).join(":")
}

function freezeClone<T>(value: T): T {
  return deepFreeze(structuredClone(value))
}

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (typeof value !== "object" || value === null || seen.has(value)) return value
  seen.add(value)
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key], seen)
  }
  return Object.freeze(value)
}

function structuralKey(value: unknown): string {
  const seen = new WeakSet<object>()
  const visit = (current: unknown): string => {
    if (current === null) return "null"
    if (current === undefined) return "undefined"
    if (typeof current === "string") return `string:${JSON.stringify(current)}`
    if (typeof current === "number") return `number:${String(current)}`
    if (typeof current === "boolean") return `boolean:${String(current)}`
    if (typeof current === "bigint") return `bigint:${current.toString()}`
    if (typeof current !== "object") {
      throw new Error(`Неподдерживаемый вход compact raw: ${typeof current}`)
    }
    if (seen.has(current)) throw new Error("Циклический вход compact raw")
    seen.add(current)
    const result = Array.isArray(current)
      ? `array:[${current.map(visit).join(",")}]`
      : `object:{${Object.entries(current).map(([key, item]) => (
        `${JSON.stringify(key)}:${visit(item)}`
      )).join(",")}}`
    seen.delete(current)
    return result
  }
  return visit(value)
}
