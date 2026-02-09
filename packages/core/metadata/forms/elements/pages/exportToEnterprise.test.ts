import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import { fullPages, fullPagesPartialEnterprise, minimalPages } from "~/tests/fixtures/forms/pages/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPagesToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullPages })

    expect(result).toEqual(fullPagesPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalPages })

    expect(result).toBeUndefined()
  })
})
