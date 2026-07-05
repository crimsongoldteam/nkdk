import { describe, expect, it } from "vitest"
import { getTypeRule, type PropertyRule } from "../../orchestration"
import { registerCoreMetadata } from "../../register"
import { mockContext } from "../../../tests/mockContext"

registerCoreMetadata()

const rule = { type: "ClientApplicationForm" } as Extract<PropertyRule, { type: "ClientApplicationForm" }>

describe("ClientApplicationForm exportToJSONSchema type rule", () => {
  it("accepts inline form properties", () => {
    const exportToJSONSchema = getTypeRule("ClientApplicationForm", "exportToJSONSchema")
    expect(exportToJSONSchema).toBeDefined()
    if (exportToJSONSchema === undefined) throw new Error("ClientApplicationForm JSON schema export is not registered")

    const schema = exportToJSONSchema({ context: mockContext, rule, value: undefined })
    expect(schema).toBeDefined()
    if (schema === undefined) throw new Error("ClientApplicationForm JSON schema is not registered")

    const json = JSON.stringify(schema)

    expect(json).toContain('"КоманднаяПанель"')
    expect(json).toContain('"Реквизиты"')
    expect(json).toContain('"Элементы"')
  }, 30_000)
})
