import { beforeAll, describe, expect, it } from "vitest"
import { getTypeRule } from "../../orchestration"
import { registerCoreMetadata } from "../../register"
import { exportClientApplicationFormToJSONSchema } from "./toJSONSchema"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { mockContext } from "../../../tests/mockContext"

registerCoreMetadata()

let compiledSchema: ReturnType<typeof compileValidationSchema>

describe("ClientApplicationForm exportToJSONSchema type rule", () => {
  beforeAll(() => {
    const schema = exportClientApplicationFormToJSONSchema({
      context: mockContext,
      rule: { type: "ClientApplicationForm" },
      value: undefined,
    })
    if (schema === undefined) throw new Error("ClientApplicationForm schema is not registered")
    compiledSchema = compileValidationSchema(schema, { eagerFallback: true })
  }, 120_000)

  it("registers client form JSON Schema exporter", () => {
    const exportToJSONSchema = getTypeRule("ClientApplicationForm", "exportToJSONSchema")
    expect(exportToJSONSchema).toBe(exportClientApplicationFormToJSONSchema)
  })

  it.each([
    [{}, true],
    [{ НазначенияИспользования: "МобильноеПриложение" }, true],
    [{ НазначенияИспользования: "ПлатформаИМобильноеПриложение" }, true],
    [{ НазначенияИспользования: "Произвольное" }, false],
  ])("validates use purposes %#", (yaml, expected) => {
    expect(compiledSchema.Check(yaml)).toBe(expected)
  })
})
