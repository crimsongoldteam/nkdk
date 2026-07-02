import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { registerCoreMetadata } from "../../register"
import { mockContext } from "../../../tests/mockContext"
import { RootCommandInterfaceRules } from "./rules"

registerCoreMetadata()

describe("RootCommandInterface JSON Schema", () => {
  it("accepts empty subsystem order separators", () => {
    const schema = exportMetadataItemToJSONSchema({ context: mockContext, rule: RootCommandInterfaceRules })
    const compiled = TypeCompiler.Compile(schema)

    expect(
      compiled.Check({
        ПорядокПодсистем: ["Подсистема.A", "", "Подсистема.A.Подсистема.B"],
      })
    ).toBe(true)
    expect(compiled.Check({ ПорядокПодсистем: ["Подсистема.A", 1] })).toBe(false)
  })
})
