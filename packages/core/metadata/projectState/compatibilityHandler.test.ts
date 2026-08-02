import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import { exportStringToJSONSchema } from "../commonObjects/string/toJSONSchema"
import { exportChildItemsToJSONSchema } from "../forms/commonObjects/childItems/toJSONSchema"
import * as orchestration from "../orchestration"
import {
  getRegisteredTypeRules,
  registerTypeRule,
} from "../orchestration/property/typeRuleRegistry"
import { describeTypeRuleHandlerForCompatibility } from "../orchestration/property/typeRuleCompatibilityIdentity"
import { fingerprintRegisteredProjectStateTypeRules } from "./compatibility"

describe("ProjectState type handler compatibility", () => {
  it("стабилизирует один runtime handler, различает замыкания и восстанавливает штатный handler", () => {
    registerTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)
    const initial = fingerprintRegisteredProjectStateTypeRules()
    const createOverride = (number: boolean) =>
      (_params: Parameters<typeof exportStringToJSONSchema>[0]) => number ? Type.Number() : Type.Boolean()
    const numberOverrideHandler = createOverride(true)
    const booleanOverrideHandler = createOverride(false)

    try {
      registerTypeRule("string", "exportToJSONSchema", numberOverrideHandler)
      const numberOverride = fingerprintRegisteredProjectStateTypeRules()
      expect(numberOverride).not.toBe(initial)

      registerTypeRule("string", "exportToJSONSchema", numberOverrideHandler)
      expect(fingerprintRegisteredProjectStateTypeRules()).toBe(numberOverride)

      registerTypeRule("string", "exportToJSONSchema", booleanOverrideHandler)
      expect(fingerprintRegisteredProjectStateTypeRules()).not.toBe(numberOverride)

      registerTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)
      expect(fingerprintRegisteredProjectStateTypeRules()).toBe(initial)
    } finally {
      registerTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)
    }
  })

  it("не раскрывает внутренние метки совместимости через orchestration", () => {
    expect(orchestration).not.toHaveProperty("markRegisteredTypeRulesAsCoreForCompatibility")
    expect(orchestration).not.toHaveProperty("markTypeRuleAsCoreForCompatibility")
    expect(getRegisteredTypeRules().some((registration) => Object.hasOwn(registration, "coreRegistrationKeys"))).toBe(false)
  })

  it("описывает штатный handler отсортированными ключами и SHA исходников", () => {
    expect(describeTypeRuleHandlerForCompatibility(exportChildItemsToJSONSchema, "source-sha")).toEqual({
      kind: "core",
      registrationKeys: [
        "CommandBarChildItems:exportToJSONSchema",
        "GroupChildItems:exportToJSONSchema",
        "PagesChildItems:exportToJSONSchema",
        "TableChildItems:exportToJSONSchema",
      ],
      sourceFingerprint: "source-sha",
    })
  })

  it("описывает runtime handlers nonce процесса и последовательными WeakMap-id", () => {
    const firstHandler = {}
    const secondHandler = {}
    const first = describeTypeRuleHandlerForCompatibility(firstHandler, "ignored") as RuntimeIdentity

    expect(first).toMatchObject({ kind: "runtime", processNonce: expect.any(String), objectId: expect.any(Number) })
    expect(describeTypeRuleHandlerForCompatibility(firstHandler, "ignored")).toEqual(first)

    const second = describeTypeRuleHandlerForCompatibility(secondHandler, "ignored") as RuntimeIdentity
    expect(second).toEqual({
      kind: "runtime",
      processNonce: first.processNonce,
      objectId: first.objectId + 1,
    })
  })
})

interface RuntimeIdentity {
  readonly kind: "runtime"
  readonly processNonce: string
  readonly objectId: number
}
