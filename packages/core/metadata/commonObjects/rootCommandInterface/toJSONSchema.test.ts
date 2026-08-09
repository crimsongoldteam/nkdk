import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { registerCoreMetadata } from "../../register"
import { mockContext } from "../../../tests/mockContext"
import { RootCommandInterfaceRules } from "./rules"

registerCoreMetadata()

describe("RootCommandInterface JSON Schema", () => {
  it("accepts empty subsystem order separators", () => {
    const schema = exportMetadataItemToJSONSchema({ context: mockContext, rule: RootCommandInterfaceRules })
    const compiled = compileValidationSchema(schema)

    expect(
      compiled.Check({
        ПорядокПодсистем: ["Подсистема.A", "", "Подсистема.A.Подсистема.B"],
      })
    ).toBe(true)
    expect(compiled.Check({ ПорядокПодсистем: ["Подсистема.A", 1] })).toBe(false)
    expect(
      compiled.Check({
        ПорядокПодсистем: ["12345678-1234-4234-9234-123456789abc"],
      })
    ).toBe(false)
  })
})
