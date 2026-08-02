import { randomUUID } from "node:crypto"
import { createRegistryKey, type TypeRulesOperations } from "./fn"
import type { PropertyRuleType } from "./registry"
import { getRegisteredTypeRules } from "./typeRuleRegistry"

const coreRegistrationKeysByHandler = new WeakMap<object, Set<string>>()
const runtimeIdByHandler = new WeakMap<object, number>()
const runtimeProcessNonce = randomUUID()
let nextRuntimeId = 1

export function markRegisteredTypeRulesAsCoreForCompatibility(): void {
  for (const registration of getRegisteredTypeRules()) {
    markHandlerRegistrationAsCore(
      registration.handler,
      createRegistryKey(registration.type, registration.operation),
    )
  }
}

export function markTypeRuleAsCoreForCompatibility(
  type: PropertyRuleType,
  operation: TypeRulesOperations,
): void {
  const key = createRegistryKey(type, operation)
  const registration = getRegisteredTypeRules().find(
    (candidate) => createRegistryKey(candidate.type, candidate.operation) === key,
  )
  if (registration !== undefined) markHandlerRegistrationAsCore(registration.handler, key)
}

export function describeTypeRuleHandlerForCompatibility(
  handler: unknown,
  coreSourceFingerprint: string,
): unknown {
  const weakKey = asWeakKey(handler)
  if (weakKey === undefined) throw new TypeError("Type rule handler must be an object or a function")

  const coreRegistrationKeys = coreRegistrationKeysByHandler.get(weakKey)
  if (coreRegistrationKeys !== undefined) {
    return {
      kind: "core",
      registrationKeys: [...coreRegistrationKeys].sort(compareCodePoints),
      sourceFingerprint: coreSourceFingerprint,
    }
  }

  let objectId = runtimeIdByHandler.get(weakKey)
  if (objectId === undefined) {
    objectId = nextRuntimeId
    nextRuntimeId += 1
    runtimeIdByHandler.set(weakKey, objectId)
  }
  return { kind: "runtime", processNonce: runtimeProcessNonce, objectId }
}

function markHandlerRegistrationAsCore(handler: unknown, key: string): void {
  const weakKey = asWeakKey(handler)
  if (weakKey === undefined) return
  const keys = coreRegistrationKeysByHandler.get(weakKey) ?? new Set<string>()
  keys.add(key)
  coreRegistrationKeysByHandler.set(weakKey, keys)
}

function asWeakKey(value: unknown): object | undefined {
  return (typeof value === "object" && value !== null) || typeof value === "function"
    ? value as object
    : undefined
}

function compareCodePoints(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
