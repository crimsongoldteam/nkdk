import { describe, expect, it } from "vitest"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { exportPropertyToJSONSchema } from "../../../ruleRuntime/property/toJSONSchema"
import { compileValidationSchema } from "../../../validation/compileValidationSchema"
import { mockContext } from "../../../../tests/mockContext"

import "./toJSONSchema"

const rule = { type: "DcsLocalStringType", yaml: "Заголовок" } as PropertyRule

describe("DcsLocalStringType JSON Schema", () => {
  it("shows !xml/type String only in the internal validation schema", () => {
    const internal = validationFor({
      ...mockContext,
      exportToJSONSchema: { mode: "inline", refs: new Set(), explicitXMLValues: true },
    })
    const external = validationFor(mockContext)

    expect(internal.Check("!xml/type String Текст")).toBe(true)
    expect(internal.Check("!xml/type")).toBe(false)
    expect(internal.Check("!xml/value String Текст")).toBe(false)
    expect(internal.Check("!xml/type Raw Текст")).toBe(false)
    expect(external.Check("!xml/type String Текст")).toBe(false)
  })
})

function validationFor(context: typeof mockContext) {
  const schema = exportPropertyToJSONSchema({ context, rule, value: undefined })
  if (schema === undefined) throw new Error("DcsLocalStringType schema is missing")
  return compileValidationSchema({}, schema)
}
