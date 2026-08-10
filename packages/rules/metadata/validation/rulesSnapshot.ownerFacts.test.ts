import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { createValidationRulesSnapshot, findValidationRulesSpec } from "./rulesSnapshot"

describe("validation owner-facts snapshot", () => {
  it("compiles tabular-section fields and standard aliases", () => {
    const spec = findValidationRulesSpec(createValidationRulesSnapshot(mockContext), "Справочник")
    const sections = spec?.properties.find((property) => property.ownerFactRole === "tabularSections")

    expect(sections?.children?.map((property) => property.modelKey)).toContain("attributes")
    expect(spec?.standardMemberAliases).toMatchObject({ Код: "Code", Наименование: "Description" })
  })
})
