import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import { fullTable, fullTableYAML, minimalTable, minimalTableYAML } from "~/tests/fixtures/forms/table/data"
import { mockContext } from "~/tests/mockContext"

describe("importTableFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.Table,
      yaml: fullTableYAML,
      source: fullTable,
    })

    expect(result).toEqual(fullTable)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.Table,
      yaml: minimalTableYAML,
      source: minimalTable,
    })

    expect(result).toEqual(minimalTable)
  })
})
