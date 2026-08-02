import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import { exportStringToJSONSchema } from "../commonObjects/string/toJSONSchema"
import { registerTypeRule } from "../orchestration/property/typeRuleRegistry"
import { fingerprintRegisteredProjectStateTypeRules } from "./compatibility"

describe("ProjectState type handler compatibility", () => {
  it("различает активные подмены и восстанавливает отпечаток для штатного handler", () => {
    registerTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)
    const initial = fingerprintRegisteredProjectStateTypeRules()

    try {
      registerTypeRule("string", "exportToJSONSchema", (_params) => Type.Number())
      const numberOverride = fingerprintRegisteredProjectStateTypeRules()
      expect(numberOverride).not.toBe(initial)

      registerTypeRule("string", "exportToJSONSchema", (_params) => Type.Boolean())
      expect(fingerprintRegisteredProjectStateTypeRules()).not.toBe(numberOverride)

      registerTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)
      expect(fingerprintRegisteredProjectStateTypeRules()).toBe(initial)
    } finally {
      registerTypeRule("string", "exportToJSONSchema", exportStringToJSONSchema)
    }
  })
})
