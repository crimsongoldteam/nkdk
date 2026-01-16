import { describe, expect, it } from "vitest"
import {
  fullTable,
  fullTableEnterprise,
  minimalTable,
  minimalTableEnterprise,
  sourceTable,
} from "~/tests/fixtures/forms/table/data"
import { mockСontext } from "~/tests/mockContext"
import { importTablePartialFromEnterprise } from "./importFromEnterprise"

describe("importTableFromEnterprise", () => {
  // it("should return undefined when data is undefined", () => {
  //   const result = importTablePartialFromEnterprise(mockСontext, undefined, fullTable.name)

  //   expect(result).toBeUndefined()
  // })

  it("should import all fields from Enterprise", () => {
    const result = importTablePartialFromEnterprise(mockСontext, sourceTable, fullTableEnterprise)

    expect(result).toEqual(fullTable)
  })

  it("should import minimal", () => {
    const result = importTablePartialFromEnterprise(mockСontext, minimalTable, minimalTableEnterprise)

    expect(result).toEqual(minimalTable)
  })
})
