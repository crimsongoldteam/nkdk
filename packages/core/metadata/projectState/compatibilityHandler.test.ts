import { Type } from "typebox"
import { beforeAll, describe, expect, it } from "vitest"
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
  let initialFingerprint = ""
  let runtimeFingerprint = ""

  beforeAll(() => {
    registerTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)
    initialFingerprint = fingerprintRegisteredProjectStateTypeRules()
    const createOverride = (number: boolean) =>
      (_params: Parameters<typeof exportStringToJSONSchema>[0]) => number ? Type.Number() : Type.Boolean()
    const numberOverrideHandler = createOverride(true)

    try {
      registerTypeRule("string", "exportToJSONSchema", numberOverrideHandler)
      runtimeFingerprint = fingerprintRegisteredProjectStateTypeRules()
    } finally {
      registerTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)
    }
  })

  it("учитывает runtime handler в отпечатке зарегистрированных правил", () => {
    expect(runtimeFingerprint).not.toBe(initialFingerprint)
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
