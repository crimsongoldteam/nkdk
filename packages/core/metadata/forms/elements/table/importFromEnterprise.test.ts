import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import "~/metadata/forms/elements/importFromEnterprise"
import {
  fullTable,
  fullTableChildItems,
  fullTableEnterprise,
  minimalTable,
  minimalTableEnterprise,
  sourceTable,
} from "~/tests/fixtures/forms/table/data"
import { mockСontext } from "~/tests/mockContext"
import { importTablePartialFromEnterprise } from "./importFromEnterprise"

describe("importTableFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const context: ConfigurationContext = {
      ...mockСontext,
      allElements: fullTableChildItems,
    }
    const result = importTablePartialFromEnterprise(context, sourceTable, fullTableEnterprise)

    expect(result).toEqual(fullTable)
  })

  it("should import minimal", () => {
    const result = importTablePartialFromEnterprise(mockСontext, minimalTable, minimalTableEnterprise)

    expect(result).toEqual(minimalTable)
  })
})
