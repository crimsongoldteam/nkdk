import { describe, expect, it } from "vitest"
import { fullTable, fullTableEnterprise, minimalTable, minimalTableEnterprise } from "~/tests/fixtures/forms/table/data"
import { mockСontext } from "~/tests/mockContext"
import { importTableFromEnterprise } from "./importFromEnterprise"

describe("importTableFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importTableFromEnterprise(mockСontext, undefined, fullTable.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importTableFromEnterprise(mockСontext, fullTableEnterprise, fullTable.name)

    expect(result).toEqual(fullTable)
  })

  it("should import minimal", () => {
    const result = importTableFromEnterprise(mockСontext, minimalTableEnterprise, minimalTable.name)

    expect(result).toEqual(minimalTable)
  })
})
