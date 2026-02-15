import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import { fullTable, fullTableEnterprise, minimalTable, minimalTableEnterprise } from "~/tests/fixtures/forms/table/data"
import { mockContext } from "~/tests/mockContext"

describe("importTableFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.Table,
      yaml: fullTableEnterprise,
      source: fullTable,
    })

    expect(result).toEqual(fullTable)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.Table,
      yaml: minimalTableEnterprise,
      source: minimalTable,
    })

    expect(result).toEqual(minimalTable)
  })
})
