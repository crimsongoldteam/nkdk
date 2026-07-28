import { createHash } from "node:crypto"
import type { MetadataItemRule } from "../orchestration/property/types"

const cache = new WeakMap<MetadataItemRule, string>()

export function fingerprintMetadataItemRule(rule: MetadataItemRule): string {
  const cached = cache.get(rule)
  if (cached !== undefined) return cached
  const canonical = canonicalValue(rule, new Set(), rule.itemType)
  const fingerprint = createHash("sha256").update(canonical).digest("hex")
  cache.set(rule, fingerprint)
  return fingerprint
}

function canonicalValue(value: unknown, stack: Set<object>, itemType: string): string {
  if (value === undefined) return "undefined"
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return JSON.stringify(value)
  }
  if (typeof value === "function") return "function"
  if (typeof value !== "object") {
    throw new Error(`Неподдерживаемое значение правила ${itemType}: ${typeof value}`)
  }
  if (stack.has(value)) throw new Error(`Циклическое правило ${itemType}`)
  stack.add(value)
  try {
    if (Array.isArray(value)) return `[${value.map((item) => canonicalValue(item, stack, itemType)).join(",")}]`
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`Неподдерживаемый объект правила ${itemType}: ${prototype?.constructor?.name ?? "unknown"}`)
    }
    return `{${Object.keys(value)
      .filter((key) => key !== "order")
      .sort(bytewiseCompare)
      .map(
        (key) => `${JSON.stringify(key)}:${canonicalValue((value as Record<string, unknown>)[key], stack, itemType)}`
      )
      .join(",")}}`
  } finally {
    stack.delete(value)
  }
}

function bytewiseCompare(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}
