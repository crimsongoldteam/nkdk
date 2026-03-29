import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import { fullTable, fullTableYAML, minimalTable, minimalTableYAML } from "~/metadata/forms/elements/table/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("importTableFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "Table",
      yaml: fullTableYAML,
      source: fullTable,
    })

    expect(result).toEqual(fullTable)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "Table",
      yaml: minimalTableYAML,
      source: minimalTable,
    })

    expect(result).toEqual(minimalTable)
  })
})
