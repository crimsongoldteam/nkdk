import type { XmlElementNode } from "../../../xml/import/document"
import { compareXmlStructures } from "../../../xml/structure/compare"
import { createYAMLPropertySource } from "../property/fromYAMLToXML"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import type {
  XmlAnomalyLocation,
  XmlCompactRawInput,
  XmlCompactRawInputs,
  XmlCompactRawRegistration,
  XmlCompactRawValue,
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
  resolveStandardIndexInput?: (params: {
    readonly index: string
    readonly keyInputs: XmlCompactRawInputs
  }) => unknown
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

      const inputValues = normalizePlainDataInputs(extractInputs({
        declarations: registration.inputs,
        rootRule: params.rule,
        propertyRule,
        rootYaml: params.yaml,
        resolvePropertyItemRule: dependencies.resolvePropertyItemRule,
        resolveStandardIndexInput: dependencies.resolveStandardIndexInput,
      }))
      const inputs = declaredInputView(inputValues)
      const cacheKey = canonicalPlainDataKey(inputValues)
      const cached = proven.get(registration)?.get(cacheKey)
      if (cached !== undefined) return cached

      try {
        const first = freezeGeneratedNodes(registration.generate(inputs))
        const firstHashes = structuralHashes(first)
        const second = freezeGeneratedNodes(registration.generate(inputs))
        if (
          firstHashes !== structuralHashes(second) ||
          compareXmlStructures(first, second).length > 0
        ) {
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
  readonly propertyRule: PropertyRule
  readonly rootYaml: unknown
  readonly resolvePropertyItemRule?: (
    rule: PropertyRule,
  ) => MetadataItemRule | undefined
  readonly resolveStandardIndexInput?: XmlAnomalyRuntimeDependencies["resolveStandardIndexInput"]
}): Record<string, unknown> {
  const byName = new Map(params.declarations.map((input) => [input.name, input]))
  const resolved = new Map<string, unknown>()
  const active = new Set<string>()
  const resolve = (name: string): unknown => {
    if (resolved.has(name)) return resolved.get(name)
    if (active.has(name)) {
      throw new Error(`Цикл standard index dependencies compact raw: ${name}`)
    }
    const input = byName.get(name)
    if (input === undefined) {
      throw new Error(`Не объявлен compact raw input: ${name}`)
    }
    active.add(name)
    try {
      const value = extractInputSource({
        input,
        rootRule: params.rootRule,
        propertyRule: params.propertyRule,
        rootYaml: params.rootYaml,
        resolvePropertyItemRule: params.resolvePropertyItemRule,
        resolveStandardIndexInput: params.resolveStandardIndexInput,
        resolveInput: resolve,
      })
      resolved.set(name, value)
      return value
    } finally {
      active.delete(name)
    }
  }
  return Object.fromEntries(params.declarations.map((input) => [
    input.name,
    resolve(input.name),
  ]))
}

function extractInputSource(params: {
  readonly input: XmlCompactRawInput
  readonly rootRule: MetadataItemRule
  readonly propertyRule: PropertyRule
  readonly rootYaml: unknown
  readonly resolvePropertyItemRule?: (
    rule: PropertyRule,
  ) => MetadataItemRule | undefined
  readonly resolveStandardIndexInput?: XmlAnomalyRuntimeDependencies["resolveStandardIndexInput"]
  readonly resolveInput: (name: string) => unknown
}): unknown {
  switch (params.input.source.kind) {
    case "yamlProperty":
      return extractYamlPropertyPath({
        propertyPath: params.input.source.propertyPath,
        rootRule: params.rootRule,
        rootYaml: params.rootYaml,
        resolvePropertyItemRule: params.resolvePropertyItemRule,
      })
    case "owner":
      return params.rootRule.itemType
    case "propertyRule":
      return extractPlainFieldPath(
        params.propertyRule,
        params.input.source.fieldPath,
        `PropertyRule projection ${params.input.name}`,
      )
    case "standardIndex": {
      if (params.resolveStandardIndexInput === undefined) {
        throw new Error(
          `Не задан resolver standard index ${params.input.source.index}`,
        )
      }
      const keyValues = normalizePlainDataInputs(Object.fromEntries(
        params.input.source.keyInputs.map((name) => [name, params.resolveInput(name)]),
      ))
      return params.resolveStandardIndexInput({
        index: params.input.source.index,
        keyInputs: declaredInputView(keyValues),
      })
    }
  }
}

function extractYamlPropertyPath(params: {
  readonly propertyPath: readonly string[]
  readonly rootRule: MetadataItemRule
  readonly rootYaml: unknown
  readonly resolvePropertyItemRule?: (
    rule: PropertyRule,
  ) => MetadataItemRule | undefined
}): unknown {
  let itemRule = params.rootRule
  let yaml = params.rootYaml
  for (const [index, propertyKey] of params.propertyPath.entries()) {
    const propertyRule = itemRule.properties[propertyKey]
    const source = createYAMLPropertySource({ yaml, rule: itemRule })
    if (propertyRule === undefined || !source.has(propertyKey)) {
      throw new Error(
        `Не найден вход compact raw ${params.propertyPath.join(".")}`,
      )
    }
    yaml = source.raw(propertyKey)
    if (index === params.propertyPath.length - 1) return yaml

    const nestedRule = params.resolvePropertyItemRule?.(propertyRule) ??
      inlineItemRule(propertyRule)
    if (nestedRule === undefined) {
      throw new Error(
        `Не найден PropertyRule path compact raw ${params.propertyPath.join(".")}`,
      )
    }
    itemRule = nestedRule
  }
  throw new Error(`Не найден вход compact raw ${params.propertyPath.join(".")}`)
}

function extractPlainFieldPath(
  root: unknown,
  path: readonly string[],
  description: string,
): unknown {
  let value = root
  for (const field of path) {
    if (typeof value !== "object" || value === null) {
      throw new Error(`Не найден ${description}: ${path.join(".")}`)
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, field)
    if (descriptor === undefined || !("value" in descriptor)) {
      throw new Error(`Не найден ${description}: ${path.join(".")}`)
    }
    value = descriptor.value
  }
  return value
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

function normalizePlainDataInputs(
  values: Readonly<Record<string, unknown>>,
): XmlCompactRawInputs {
  return normalizePlainData(values, new WeakSet(), "inputs") as XmlCompactRawInputs
}

function normalizePlainData(
  value: unknown,
  ancestors: WeakSet<object>,
  path: string,
): XmlCompactRawValue {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string" ||
    typeof value === "bigint"
  ) return value
  if (typeof value !== "object") {
    throw new Error(`Compact raw input ${path} должен быть plain-data`)
  }
  if (ancestors.has(value)) {
    throw new Error(`Compact raw input ${path} должен быть plain-data без циклов`)
  }
  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype) {
        throw new Error(`Compact raw input ${path} должен быть plain-data array`)
      }
      for (const key of Reflect.ownKeys(value)) {
        if (key === "length") continue
        const descriptor = typeof key === "string"
          ? Object.getOwnPropertyDescriptor(value, key)
          : undefined
        if (
          typeof key !== "string" ||
          !isArrayIndex(key, value.length) ||
          descriptor === undefined ||
          !("value" in descriptor) ||
          descriptor.enumerable !== true
        ) {
          throw new Error(`Compact raw input ${path} должен быть plain-data array`)
        }
      }
      const result: XmlCompactRawValue[] = []
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index))
        if (descriptor === undefined || !("value" in descriptor)) {
          throw new Error(`Compact raw input ${path} должен быть plain-data array без пропусков`)
        }
        result.push(normalizePlainData(
          descriptor.value,
          ancestors,
          `${path}[${index}]`,
        ))
      }
      return Object.freeze(result)
    }

    const prototype: unknown = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`Compact raw input ${path} должен быть plain-data record`)
    }
    const result: Record<string, XmlCompactRawValue> = Object.create(null)
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") {
        throw new Error(`Compact raw input ${path} должен быть plain-data record без symbol keys`)
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (
        descriptor === undefined ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        throw new Error(`Compact raw input ${path}.${key} должен быть plain-data field`)
      }
      result[key] = normalizePlainData(
        descriptor.value,
        ancestors,
        `${path}.${key}`,
      )
    }
    return Object.freeze(result)
  } finally {
    ancestors.delete(value)
  }
}

function isArrayIndex(key: string, length: number): boolean {
  if (!/^(0|[1-9][0-9]*)$/.test(key)) return false
  const index = Number(key)
  return Number.isSafeInteger(index) && index >= 0 && index < length
}

function declaredInputView(inputs: XmlCompactRawInputs): XmlCompactRawInputs {
  const declared = new Set(Object.keys(inputs))
  const assertDeclared = (property: PropertyKey): void => {
    if (typeof property !== "string" || !declared.has(property)) {
      throw new Error(`Необъявленный compact raw input: ${String(property)}`)
    }
  }
  return new Proxy(inputs, {
    get(target, property, receiver) {
      assertDeclared(property)
      return Reflect.get(target, property, receiver)
    },
    has(target, property) {
      assertDeclared(property)
      return Reflect.has(target, property)
    },
    getOwnPropertyDescriptor(target, property) {
      assertDeclared(property)
      return Reflect.getOwnPropertyDescriptor(target, property)
    },
  })
}

function canonicalPlainDataKey(value: XmlCompactRawValue): string {
  if (value === null) return "z"
  if (typeof value === "boolean") return value ? "b1" : "b0"
  if (typeof value === "string") return `s${frame(value)}`
  if (typeof value === "bigint") return `i${frame(value.toString())}`
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "nNaN"
    if (value === Infinity) return "n+Infinity"
    if (value === -Infinity) return "n-Infinity"
    if (Object.is(value, -0)) return "n-0"
    return `n${frame(String(value))}`
  }
  if (Array.isArray(value)) {
    return `a${value.length}:${value.map((item) => (
      frame(canonicalPlainDataKey(item))
    )).join("")}`
  }
  const entries = Object.entries(value)
  return `o${entries.length}:${entries.map(([key, item]) => (
    `${frame(key)}${frame(canonicalPlainDataKey(item))}`
  )).join("")}`
}

function frame(value: string): string {
  return `${value.length}:${value}`
}
